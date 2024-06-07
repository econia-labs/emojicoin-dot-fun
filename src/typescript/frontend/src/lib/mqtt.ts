import { connect } from "mqtt";
import { MQTT_URL } from "./env";
import { STRUCT_STRINGS } from "@sdk/utils";

export const getMqttClient = () => {
    return connect(MQTT_URL);
}

export class TopicBuilder {
    /**
     * Build an MQTT topic.
     *
     * Null values will be replaced by a wildcard.
     *
     * Examples:
     *
     * ```ts
     * // Get all chat events on market 3
     * let a = buildTopic(STRUCT_STRINGS.ChatEvent, 3)
     * assertEq(a, "0x…::emojicoin_dot_fun::Chat/3")
     * // Get all events on market 2
     * let b = buildTopic(null, 2, '#')
     * assertEq(a, "+/2/#")
     * // Get periodic state events on market 4 with period 60000000
     * let c = buildTopic(STRUCT_STRINGS.MarketRegistrationEvent, 4, '60000000')
     * assertEq(c, "0x…::emojicoin_dot_fun::MarketRegistration/4/60000000")
     * ```
     *
     * Note: some events will have a 3-level topic (e.g.: periodic events which
     * have EVENT_TYPE/MARKET_ID/PERIOD), these will not be matched by "+/MARKET_ID",
     * but will be by "+/MARKET_ID/+" or "+/MARKET_ID/#". Others have 2-level topic
     * (e.g.: market registrations which have EVENT_TYPE/MARKET_ID), these will be
     * matched by "+/MARKET_ID" and "+/MARKET_ID/#" but not by "+/MARKET_ID/+".
     * **Calling this function with only two arguments, like buildTopic(…, …) will
     * thus only subscribe to events with a 2-level topic, and not all topics.**
     */
    public static build(eventType: string | null, marketId: number | null, ...args: string[]): string {
        let topic = `${eventType !== null ? eventType : '+'}/${marketId !== null ? marketId : '+'}`;
        for (const arg of args) {
            topic = `${topic}/${arg}`;
        }
        return topic;
    }

    /**
     * Build an MQTT topic for PeriodicState events.
     *
     * Null values will be replaced by a wildcard.
     */
    public static periodicState(marketId: number | null, period: number | null) {
        return TopicBuilder.build(STRUCT_STRINGS.PeriodicStateEvent, marketId, period !== null ? `${period}` : '+')
    }

    /**
     * Build an MQTT topic for Swap events.
     *
     * Null values will be replaced by a wildcard.
     */
    public static swapTopic(marketId: number | null, resultsInStateTransition: boolean | null) {
        return TopicBuilder.build(STRUCT_STRINGS.SwapEvent, marketId, resultsInStateTransition !== null ? `${resultsInStateTransition}` : '+')
    }
    /**
     * Build an MQTT topic for MarketRegistration events.
     *
     * Null values will be replaced by a wildcard.
     */
    public static marketRegistrationTopic(marketId: number | null) {
        return TopicBuilder.build(STRUCT_STRINGS.MarketRegistrationEvent, marketId)
    }

    /**
     * Build an MQTT topic for Chat events.
     *
     * Null values will be replaced by a wildcard.
     */
    public static chatTopic (marketId: number | null) {
        return TopicBuilder.build(STRUCT_STRINGS.ChatEvent, marketId)
    }

    /**
     * Build an MQTT topic for State events.
     *
     * Null values will be replaced by a wildcard.
     */
    public static stateTopic (marketId: number | null) {
        return TopicBuilder.build(STRUCT_STRINGS.StateEvent, marketId)
    }

    /**
     * Build an MQTT topic for Liquidity events.
     *
     * Null values will be replaced by a wildcard.
     */
    public static liquidityTopic (marketId: number | null) {
        return TopicBuilder.build(STRUCT_STRINGS.LiquidityEvent, marketId)
    }
}
