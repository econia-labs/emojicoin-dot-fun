def get_q_v_f(m_o, m_s, p_crit):
    return m_o / ((m_s / m_o) * p_crit - 1)


def get_b_v_f(m_o, m_s, p_crit):
    return m_o / (p_crit - m_o / m_s)


def get_p_l(m_s, b_v_f, q_v_f):
    return q_v_f / (m_s + b_v_f)


m_a = 10_000.0
m_e = 1_000_000.0
p_crit = 1.0
m_o = m_a * (10.0**8)
m_s = m_e * (10.0**8)

print(f"m_a: {m_a}")
print(f"m_e: {m_e}")
print(f"p_crit: {p_crit}")

b_v_f = get_b_v_f(m_o, m_s, p_crit)
q_v_f = get_q_v_f(m_o, m_s, p_crit)
p_l = get_p_l(m_s, b_v_f, q_v_f)

print(f"b_v_f: {b_v_f}")
print(f"q_v_f: {q_v_f}")
print(f"p_l: {p_l}")

l_1 = (m_s + b_v_f) * q_v_f
l_2 = b_v_f * (m_o + q_v_f)
p_h = (q_v_f + m_o) / b_v_f

print(f"Resultant liquidity check 1: {l_1}")
print(f"Resultant liquidity check 2: {l_2}")
print(f"Critical price check: {p_h}")
