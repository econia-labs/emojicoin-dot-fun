import { LINKS } from "lib/env";

type Info = {
  title: string;
  paragraph: string;
};
const INFO: Info[] = [
  {
    title: "What is the emojicoin arena?",
    paragraph:
      "emojicoin arena is a gamified trading venue with a daily free-for-all known as a melee. Think of it like the coliseum (arena) with a different game (melee) every day of the week. Each melee features two randomly selected emojicoins that traders can swap between with reduced fees. emojicoin arena offers rewards, performance tracking, and a fun competitive environment where the best traders rack up the highest earnings.",
  },
  {
    title: "How do melees work?",
    paragraph:
      "A melee is a daily trading event featuring two randomly selected emojicoins. When one melee ends, another begins with two new random emojicoins. You can enter a melee by swapping APT into one of the featured emojicoins using the arena page. Your position is then tracked in the arena, allowing you to easily swap between the two emojicoins or exit when ready.",
  },
  {
    title: "Why trade in the arena?",
    paragraph:
      "emojicoin arena answers the age-old question: what are we trading today? In other words, emojicoin arena concentrates activity around a single trading pair each day, allowing the best traders to compete purely on trading strategies without any confusing guesswork. Trading in the arena offers three key benefits: 1) lower fees compared to regular swaps, 2) rewards through a 'lock in' feature where your deposits can be matched with additional APT, and 3) performance tracking to see your profits and losses.",
  },
  {
    title: "How do I 'win' in the arena?",
    paragraph:
      "Success in emojicoin arena comes from strategic trading between the two emojicoins featured in a melee. By entering early, locking in for matched rewards, and skillfully timing your swaps between the two emojicoins, you can maximize your returns. Your goal is to simply end with more value than you started with, either by holding the emojicoins you believe will increase in value or by actively trading between them to capture price movements.",
  },
  {
    title: "What is 'locking in' and why should I do it?",
    paragraph:
      "Locking in is a reward mechanism that matches a portion of your APT deposit with additional APT from the rewards pool. The earlier you lock in during a melee, the higher percentage match you receive. When locked in, your position remains in the melee until it ends, unless you 'tap out' by returning the matched APT. This feature rewards early participants and encourages commitment for the full melee duration.",
  },
  {
    title: "How does trading work in a melee?",
    paragraph:
      "When you enter a melee, you choose one of the two featured emojicoins to hold. If you want to swap to the other emojicoin, all of your holdings are exchanged at once. This all-or-nothing approach simplifies trading and helps track performance. The price chart shows how many of the right-side emojicoin you can get for one of the left-side emojicoin, making it easy to see which emojicoin is gaining value relative to the other.",
  },
  {
    title: "How do I exit a melee?",
    paragraph:
      "You can exit an active melee at any time if you haven't locked in. If you've locked in, you can only exit when the melee ends or by 'tapping out' (returning your matched APT). For melees that have already ended, go to your Profile tab and click the exit button next to the relevant melee.",
  },
  {
    title: "How are emojicoins selected for a melee?",
    paragraph:
      "emojicoins are selected using Aptos randomness. Nobody, including the developers, can choose or influence which emojicoins are featured in a melee. This ensures fair and unpredictable daily competitions.",
  },
  {
    title: "I don't fully understand how the arena works, what should I do?",
    paragraph:
      "You can join the discord" + LINKS?.discord
        ? ` (${LINKS!.discord}) `
        : " " + "where developers and other community members can help you.",
  },
];

export const InfoTab = () => (
  <div className="w-[100%] h-[100%]">
    <div className="w-[100%] p-[1em] flex flex-col gap-[2em] max-w-[80ch] m-auto overflow-scroll">
      {INFO.map((i, index) => (
        <div key={`info-p-${index}`} className="flex flex-col gap-[1em]">
          <div className="text-3xl uppercase text-white">{i.title}</div>
          <div className="font-forma text-light-gray">{i.paragraph}</div>
        </div>
      ))}
    </div>
  </div>
);
