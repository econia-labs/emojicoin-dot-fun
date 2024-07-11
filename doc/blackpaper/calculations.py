# cspell:word texttt
from math import isclose, sqrt

A = 10_000.0
R = 3.5**2
T = 10_000.0

F_P = 25.0

M_A = T * (1 + sqrt(R))
P_S = 1 / A
C_E = A * T * sqrt(R)

SCALE_TO_SUBUNITS = 10**8


def get_q_r_c(m_a, c_e, p_s):
    return m_a - c_e * p_s


def get_r_e(A, T):
    return A * T


def get_s_e(m_a, p_s):
    return m_a / p_s


def get_b_v_f(m_a, c_e, p_s):
    return c_e * (m_a - c_e * p_s) / (2 * c_e * p_s - m_a)


def get_q_v_f(m_a, c_e, p_s):
    return ((m_a - c_e * p_s) ** 2) / (2 * c_e * p_s - m_a)


def get_b_v_c(A, R, T):
    return A * T * R / (sqrt(R) - 1)


def get_q_v_c(m_a, c_e, p_s):
    return c_e * p_s * (m_a - c_e * p_s) / (2 * c_e * p_s - m_a)


def get_d_p(m_a, c_e, p_s):
    return c_e * p_s / m_a * 100


def get_p_l(m_a, c_e, p_s):
    return ((m_a - c_e * p_s) ** 2) / ((c_e**2) * p_s)


def get_L_i(m_a, c_e, p_s):
    return (m_a - c_e * p_s) / sqrt(p_s)


q_r_c = get_q_r_c(M_A, C_E, P_S)
r_e = get_r_e(A, T)
s_e = get_s_e(M_A, P_S)
b_v_f = get_b_v_f(M_A, C_E, P_S)
q_v_f = get_q_v_f(M_A, C_E, P_S)
b_v_c = get_b_v_c(A, R, T)
q_v_c = get_q_v_c(M_A, C_E, P_S)
d_p = get_d_p(M_A, C_E, P_S)
p_l = get_p_l(M_A, C_E, P_S)
L_i = get_L_i(M_A, C_E, P_S)


def print_vars(section_label, vars):
    print(f"{section_label}:")  # noqa: E231
    labels = []
    for var in vars:
        labels.append(f"{var[0]} ({var[1]})")
    max_label_length = max(len(s) for s in labels)
    for label, var in zip(labels, vars):
        pad = (max_label_length - len(label)) * " "
        print(pad + label + f": {var[2]:,}")  # noqa: E231
    print()


def print_latex_nominals(vars):
    for var in vars:
        if len(var) == 2:
            val = var[1]
            assert val.is_integer()
            val = f"{int(var[1]):,}"  # noqa: E231
        else:
            val = f"{var[1]:,.15f}"  # noqa: E231
        print(f"${var[0]}$ & {val} \\\\ \\hline")
    print()


def print_constants(vars):
    vals = []
    for var in vars:
        if var[0] != "LP_TOKENS_INITIAL":
            assert var[1].is_integer()
        val = var[1]
        if var[0] != "POOL_FEE_RATE_BPS":
            val = val * SCALE_TO_SUBUNITS
        val = int(val)
        vals.append(val)
        left_col = f"\\texttt{{{var[0]}}} &"
        right_col = f"\\texttt{{{val:_}}} \\\\ \\hline"  # noqa: E231
        print((left_col + right_col).replace("_", "\\_"))
    print()
    for var, val in zip(vars, vals):
        var_type = "u8" if var[0] == "POOL_FEE_RATE_BPS" else "u64"
        print(f"const {var[0]}: {var_type} = {val:_};")  # noqa: E231,E702


print_vars(
    "Alternate economic variables",
    [
        ["Approx emojicoins per APT", "A", A],
        ["Bonding curve endpoints price ratio", "R", R],
        ["Total APT deposited into bonding curve", "T", T],
    ],
)

print_vars(
    "Original economic variables",
    [
        ["Market cap", "M_A", M_A],
        ["Circulating emojicoins", "C_E", C_E],
        ["Spot price", "P_S", P_S],
    ],
)

print_vars(
    "Derived variables",
    [
        ["Real quote reserves ceiling", "q_r_c", q_r_c],
        ["Emojicoin remainder", "r_e", r_e],
        ["Total emojicoin supply", "s_e", s_e],
        ["Dilution percentage", "d_p", d_p],
        ["Low price range endpoint", "p_l", p_l],
        ["Initial LP tokens", "L_i", L_i],
    ],
)

print_vars(
    "Virtual reserve variables",
    [
        ["Base virtual floor", "b_v_f", b_v_f],
        ["Quote virtual floor", "q_v_f", q_v_f],
        ["Base virtual ceiling", "b_v_c", b_v_c],
        ["Quote virtual ceiling", "q_v_c", q_v_c],
    ],
)

print_latex_nominals(
    [
        ["A", A],
        ["R", R, False],
        ["T = q_{r ,c}", T],
        ["m_a", M_A],
        ["c_e = b_{r, c}", C_E],
        ["r_e", r_e],
        ["s_e", s_e],
        ["d_\\%", d_p, False],
        ["p_s = p_h", P_S, False],
        ["p_l", p_l, False],
        ["L_i", L_i, False],
        ["f_p", F_P],
        ["b_{v, f}", b_v_f],
        ["q_{v, f}", q_v_f],
        ["b_{v, c}", b_v_c],
        ["q_{v, c}", q_v_c],
    ]
)

print_constants(
    [
        ["MARKET_CAP", M_A],
        ["EMOJICOIN_REMAINDER", r_e],
        ["EMOJICOIN_SUPPLY", s_e],
        ["LP_TOKENS_INITIAL", L_i],
        ["BASE_REAL_FLOOR", 0.0],
        ["QUOTE_REAL_FLOOR", 0.0],
        ["BASE_REAL_CEILING", C_E],
        ["QUOTE_REAL_CEILING", T],
        ["BASE_VIRTUAL_FLOOR", b_v_f],
        ["QUOTE_VIRTUAL_FLOOR", q_v_f],
        ["BASE_VIRTUAL_CEILING", b_v_c],
        ["QUOTE_VIRTUAL_CEILING", q_v_c],
        ["POOL_FEE_RATE_BPS", F_P],
    ]
)

# Check assorted systems of equations.
assert isclose(q_r_c / P_S, r_e)
assert P_S == M_A / (C_E + r_e)
assert s_e == C_E + r_e
assert isclose(r_e, q_r_c / P_S)
assert (C_E + b_v_f) * q_v_f == b_v_f * (q_r_c + q_v_f)
assert q_v_c / b_v_f == P_S
assert q_v_c * b_v_f == q_v_f * b_v_c
assert b_v_c == C_E + b_v_f
assert q_v_c == q_r_c + q_v_f
assert isclose(p_l, q_v_f / b_v_c)
assert C_E == (b_v_c * q_r_c) / (q_v_f + q_r_c)
assert q_r_c == (C_E * q_v_c) / (b_v_f + C_E)
assert isclose(L_i, sqrt(q_r_c * r_e))
assert isclose(A, 1 / P_S)
assert isclose(P_S / p_l, R)
assert T == q_r_c
assert d_p == C_E / s_e * 100
