extern crate proc_macro;
use proc_macro::TokenStream;
use proc_macro2::Span;
use quote::{quote, ToTokens};
use syn::{
    parse_quote, punctuated::{Pair, Punctuated}, token::Comma, Expr, Ident, Pat
};

fn add_to_owned_call(expr: &mut Expr) {
    match expr {
        Expr::Call(expr_call) => {
            expr_call.args.iter_mut().for_each(add_to_owned_call);
        }
        _ => {
            *expr = parse_quote!{ #expr.to_owned() }
        }
    }
}

const CACHE_HEADER: &str = "x-edf-cached";

#[proc_macro_attribute]
pub fn restapi_cache(attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = syn::parse_macro_input!(item as syn::ItemFn);

    assert_eq!(
        &input.sig.output.to_token_stream().to_string().replacen("-> ", "", 1),
        "ResponseResult",
        "A cached function must return ResponseResult.",
    );

    let mut attr = syn::parse_macro_input!(attr as syn::Expr);

    add_to_owned_call(&mut attr);

    let mut hidden_fn_sig = input.sig.clone();
    hidden_fn_sig.ident = Ident::new("hidden_fn", Span::call_site());

    // Transform `a: A, b: B, c: C` into `a, b, c`
    let params: Punctuated<Box<Pat>, Comma> = Punctuated::from_iter(
        input
            .sig
            .inputs
            .clone()
            .into_pairs()
            .map(|pair| {
                let (value, punct) = pair.into_tuple();
                let value = match value {
                    syn::FnArg::Receiver(_) => unimplemented!(),
                    syn::FnArg::Typed(pat_type) => pat_type.pat,
                };
                Pair::new(value, punct)
            }),
    );

    let vis = input.vis;
    let mut sig = input.sig;
    if !sig.inputs.to_token_stream().to_string().replace(" ","").contains("State(state):State<Arc<AppState>>") {
        sig.inputs.insert(0, parse_quote! {State(state): State<Arc<AppState>>});
    }
    let block = input.block;

    quote! {
        #vis #sig {
            #hidden_fn_sig #block

            let key = #attr;

            if let Some(response) = state.cache().get(&key).await {
                return match response {
                    Ok(mut response) => {
                        response.0.insert(
                            axum::http::HeaderName::from_static(#CACHE_HEADER),
                            axum::http::HeaderValue::from_static("true"),
                        );
                        Ok(response)
                    }
                    Err(mut response) => {
                        response.0.insert(
                            axum::http::HeaderName::from_static(#CACHE_HEADER),
                            axum::http::HeaderValue::from_static("true"),
                        );
                        Err(response)
                    }
                };
            }

            let state_clone = state.clone();

            let res = hidden_fn(#params).await;

            state_clone.cache().insert(key, res.clone()).await;

            res
        }
    }
    .into()
}
