use finl_unicode::grapheme_clusters::Graphemes;

fn to_codepoint(c: char) -> String {
    c.escape_unicode()
        .to_string()
        .replace("\\u{", "")
        .replace("}", "")
}

pub fn to_codepoints(bytes: Vec<u8>) -> Vec<String> {
    let str = String::from_utf8(bytes).unwrap();
    let groups = Graphemes::new(&str).collect::<Vec<_>>();

    groups
        .into_iter()
        .map(|x| {
            x.chars()
                .map(to_codepoint)
                .reduce(|p, c| format!("{p}_{c}"))
                .unwrap_or(String::new())
        })
        .filter(|x| !x.is_empty())
        .collect::<Vec<_>>()
}

pub fn to_scn(bytes: Vec<u8>) -> String {
    to_codepoints(bytes)
        .into_iter()
        .reduce(|p, c| format!("{p}+{c}"))
        .unwrap_or(String::new())
}

pub trait Scn {
    fn emoji_bytes(&self) -> Vec<u8>;
    fn scn(&self) -> String {
        to_scn(self.emoji_bytes())
    }
    fn codepoints(&self) -> Vec<String> {
        to_codepoints(self.emoji_bytes())
    }
}
