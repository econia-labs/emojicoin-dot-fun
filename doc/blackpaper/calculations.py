from math import sqrt

A = 1_000_000.0
R = 9.0
T = 5_000.0

M_A = T * (1 + sqrt(R))
P_S = 1 / A
C_E = A * T * sqrt(R)

SCALE_TO_SUBUNITS = 10**8


def get_q_r_c(m_a, c_e, p_s):
    return m_a - c_e * p_s


def get_r_e(m_a, c_e, p_s):
    return (m_a - c_e * p_s) / p_s


def get_s_e(m_a, p_s):
    return m_a / p_s


def get_b_v_f(m_a, c_e, p_s):
    return c_e * (m_a - c_e * p_s) / (2 * c_e * p_s - m_a)


def get_q_v_f(m_a, c_e, p_s):
    return ((m_a - c_e * p_s) ** 2) / (2 * c_e * p_s - m_a)


def get_b_v_c(m_a, c_e, p_s):
    return (c_e**2) * p_s / (2 * c_e * p_s - m_a)


def get_q_v_c(m_a, c_e, p_s):
    return c_e * p_s * (m_a - c_e * p_s) / (2 * c_e * p_s - m_a)


def get_d_p(m_a, c_e, p_s):
    return c_e * p_s / m_a * 100


def get_p_l(m_a, c_e, p_s):
    return ((m_a - c_e * p_s) ** 2) / ((c_e**2) * p_s)


def get_L_i(m_a, c_e, p_s):
    return (m_a - c_e * p_s) / sqrt(p_s)


q_r_c = get_q_r_c(M_A, C_E, P_S)
r_e = get_r_e(M_A, C_E, P_S)
s_e = get_s_e(M_A, P_S)
b_v_f = get_b_v_f(M_A, C_E, P_S)
q_v_f = get_q_v_f(M_A, C_E, P_S)
b_v_c = get_b_v_c(M_A, C_E, P_S)
q_v_c = get_q_v_c(M_A, C_E, P_S)
d_p = get_d_p(M_A, C_E, P_S)
p_l = get_p_l(M_A, C_E, P_S)
L_i = get_L_i(M_A, C_E, P_S)

def print_vars(section_label, vars):
    print(f"{section_label}:")
    labels = []
    for var in vars:
        labels.append(f"{var[0]} ({var[1]})")
    max_label_length = max(len(s) for s in labels)
    for label, var in zip(labels, vars):
        print((max_label_length - len(label)) * " " + label + f": {var[2]:,}")
    print()

print_vars("Alternate economic variables", [
    ["Approx emojicoins per APT", "A", A],
    ["bonding curve endpoints price ratio", "R", R],
    ["Total APT deposited into bonding curve", "T", T],
])

print_vars("Original economic variables", [
    ["Market cap", "M_A", M_A],
    ["Circulating emojicoins", "C_E", C_E],
    ["Spot price", "P_S", P_S],
])

print_vars("Derived variables", [
    ["Real quote reserves ceiling", "q_r_c", q_r_c],
    ["Emojicoin remainder", "r_e", r_e],
    ["Total emojicoin supply", "s_e", s_e],
    ["Dilution percentage", "d_p", d_p],
    ["Low price range endpoint", "p_l", p_l],
    ["Initial LP tokens", "L_i", L_i],
])

print_vars("Virtual reserve variables", [
    ["Base virtual floor", "b_v_f", b_v_f],
    ["Quote virtual floor", "q_v_f", q_v_f],
    ["Base virtual ceiling", "b_v_c", b_v_c],
    ["Quote virtual ceiling", "q_v_c", q_v_c],
])

print(f"MARKET_CAP: {int(M_A * SCALE_TO_SUBUNITS): _}")
print(f"EMOJICOIN_REMAINDER: {int(r_e * SCALE_TO_SUBUNITS): _}")
print(f"EMOJICOIN_SUPPLY: {int(s_e * SCALE_TO_SUBUNITS): _}")
print(f"LP_TOKENS_INITIAL: {int(L_i * SCALE_TO_SUBUNITS): _}")
print(f"BASE_REAL_FLOOR: {int(0): _}")
print(f"QUOTE_REAL_FLOOR: {int(0): _}")
print(f"BASE_REAL_CEILING: {int(C_E * SCALE_TO_SUBUNITS): _}")
print(f"QUOTE_REAL_CEILING: {int(q_r_c * SCALE_TO_SUBUNITS): _}")
print(f"BASE_VIRTUAL_FLOOR: {int(b_v_f * SCALE_TO_SUBUNITS): _}")
print(f"QUOTE_VIRTUAL_FLOOR: {int(q_v_f * SCALE_TO_SUBUNITS): _}")
print(f"BASE_VIRTUAL_CEILING: {int(b_v_f * SCALE_TO_SUBUNITS): _}")
print(f"QUOTE_VIRTUAL_CEILING: {int(q_v_f * SCALE_TO_SUBUNITS): _}")

# Check assorted systems of equations.
assert q_r_c / P_S == r_e
assert P_S == M_A / (C_E + r_e)
assert s_e == C_E + r_e
assert r_e == q_r_c / P_S
assert (C_E + b_v_f) * q_v_f == b_v_f * (q_r_c + q_v_f)
assert q_v_c / b_v_f == P_S
assert q_v_c * b_v_f == q_v_f * b_v_c
assert b_v_c == C_E + b_v_f
assert q_v_c == q_r_c + q_v_f
assert p_l == q_v_f / b_v_c
assert C_E == (b_v_c * q_r_c) / (q_v_f + q_r_c)
assert q_r_c == (C_E * q_v_c) / (b_v_f + C_E)
assert L_i == sqrt(q_r_c * r_e)
assert A == 1 / P_S
assert P_S / p_l == R
assert T == q_r_c
assert d_p == C_E / s_e * 100
