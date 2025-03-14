import { LINKS } from "lib/env";

type Info = {
  title: string;
  paragraph: string;
};
const INFO: Info[] = [
  {
    title: "What is an emojicoin.fun arena?",
    paragraph:
      "An arena is a daily emojicoin.fun event where two random emojicoins " +
      "are selected to participate in an epic battle. When selected, the two " +
      "emojicoins will be displayed on the home page, and you will be able " +
      "to enter the arena and swap between the two. Upon entering, your APT " +
      "will be converted to the emojicoin of your choice. Once entered, you " +
      "can only swap between the two emojicoins in the arena. You can exit " +
      "at any time and withdraw your emojicoins.",
  },
  {
    title: "How long does an arena last?",
    paragraph:
      "An arena lasts for 24 hours. When an arena ends, the next one starts " +
      "with two new random emojicoins.",
  },
  {
    title: "Can I request an emojicoin to be part of an arena?",
    paragraph:
      "No. Emojicoins are randomly selected on chain. Nobody is able to " +
      "chose or alter the random selection of emojicoins.",
  },
  {
    title: "What does locking in means?",
    paragraph:
      "Locking in is a reward mechanism. Upon entering, you can lock in. If " +
      "you do so, you will be matched a certain amount of APT. The exact " +
      "amount you will get matched will be shown to you during the entering " +
      "process. The earlier you lock in, the more APT you will be matched. " +
      "If there are no rewards remaining, you will not be matched. When " +
      "locking in, you can only exit after the melee ends. If you really " +
      "wish to exit before the melee ends, you can tap out early, by paying " +
      "back the APT amount you get matched. For example, let's say you enter " +
      "a melee with 1 APT, and you get matched 1 APT, and 2 APT gets you " +
      "1000 of one of the two emojicoins. After 30 minutes, you managed to " +
      "triple your emojicoins, and you now have 3000 of them. If you wish to " +
      "withdraw them before the melee has ended, in order to sell them for " +
      "example, you can do so, but you'll have to pay back the 1 APT you got " +
      "matched at the start. This can be worth it, depending on your scenario.",
  },
  {
    title: "What is the difference between trading inside the arena and outside the arena?",
    paragraph:
      "Arena puts two emojicoins in the spotlight, generating a lot of " +
      "activity for both of them. Furthermore, you can swap from one " +
      "emojicoin to the other with 50% less fees it would cost to do that " +
      "outside of an arena (because you only do one swap, from emojicoin A " +
      "to emojicoin B, instead of swapping from emojicoin A to APT and then " +
      "from APT to emojicoin B).",
  },
  {
    title: "What does the price chart represent?",
    paragraph:
      "The price chart shows the price of the emojicoin on the left side in " +
      "terms of the emojicoin of the right side. For example, if the price is " +
      "3, that means that one of the emojicoins on the right can buy you " +
      "three of the emojicoins on the left. If the price goes up, this is " +
      "good for the emojicoin on the right. If the price goes down, this is " +
      "good for the emojicoin on the left. In other words, the is no green " +
      "is good or red is bad, it depends on which side you're on. The whole " +
      "point of the arena is for you to switch sides at the best moment, " +
      "when the price trend starts to change.",
  },
  {
    title:
      "I participated in an arena but didn't exit before the end of the " +
      "arena. How do I exit past arenas?",
    paragraph:
      "To exit a past arena, you can go to the Profile tab, and click the " +
      "exit button next to the arena you wish to exit. If the exit button is " +
      "not present, it means you already exited that arena.",
  },
  {
    title: "I don't fully understand how the arena works, what should I do?",
    paragraph:
      "You can join our discord" + LINKS?.discord
        ? ` (${LINKS!.discord}) `
        : " " + "where the developpers other members of the community can help you.",
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
