from math import sqrt

M_A = 10_000
C_E = 750_000
P_S = 0.01
SCALE_TO_SUBUNITS = 10**8

assert M_A > C_E * P_S, f"M_A must be greater than {C_E * P_S}"
assert M_A < 2 * C_E * P_S, f"M_A must be less than {2 * C_E * P_S}"


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
p_l = get_p_l(M_A, C_E, P_S)
L_i = get_L_i(M_A, C_E, P_S)


print(f"M_A: {M_A}")
print(f"C_E: {C_E}")
print(f"P_S: {P_S}")
print()

print(f"q_r_c: {q_r_c}")
print(f"r_e: {r_e}")
print(f"s_e: {s_e}")
print(f"b_v_f: {b_v_f}")
print(f"q_v_f: {q_v_f}")
print(f"b_v_c: {b_v_c}")
print(f"q_v_c: {q_v_c}")
print(f"p_l: {p_l}")
print(f"L_i: {L_i}")
print()

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
