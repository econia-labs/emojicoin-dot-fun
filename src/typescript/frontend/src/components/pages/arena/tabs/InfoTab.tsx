import { LINKS } from "lib/env";

type Info = {
  title: string;
  paragraph: string;
};
const INFO: Info[] = [
  {
    title: "What is an emojicoin.fun melee?",
    paragraph:
      "An emojicoin.fun melee is a 24-hour trading event featuring two randomly " +
      "selected emojicoins. During a melee, participants can trade exclusively " +
      "between these two emojicoins for reduced fees. Users can also choose to " +
      '"lock in" for the full duration, receiving matched APT amounts based on ' +
      "how early they lock in and while rewards last. " +
      "The arena refers to the ongoing series of daily melees.",
  },
  {
    title: "How long does a melee last?",
    paragraph:
      "A melee lasts for 24 hours. When a melee ends, the next one starts " +
      "with two new random emojicoins.",
  },
  {
    title: "Can I request an emojicoin to be part of a melee?",
    paragraph:
      "No. Emojicoins are randomly selected using Aptos randomness. Nobody is " +
      "able to choose or alter the random selection of emojicoins.",
  },
  {
    title: "What does locking in mean?",
    paragraph:
      "Locking in is a reward mechanism that will match a portion of the APT" +
      "you deposit upon entering a melee. The exact amount matched is displayed" +
      "during the entering process. The matched amount percentage decreases" +
      "over time for each melee, so locking in earlier yields a higher matched" +
      "deposit amount. Deposits are only matched if there are rewards remaining." +
      'Once locked in, you can only exit when the melee ends or by "tapping out".' +
      "Tapping out means exiting before the melee ends by returning the APT amount" +
      "you were matched upon deposit. For example, let's say you enter " +
      "a melee with 2 APT, and you get matched 1 APT, and 3 APT gets you " +
      "1000 of one of the two emojicoins. After 30 minutes, you managed to " +
      "triple your emojicoins, and you now have 3000 of them. If you wish to " +
      "withdraw them before the melee has ended, in order to sell them for " +
      "example, you can do so, but you'll have to pay back the 1 APT you got " +
      "matched at the start.",
  },
  {
    title: "What is the difference between trading inside the melee and outside the melee?",
    paragraph:
      "Trades you make in the arena incur 50% less fees than manually swapping between" +
      "two emojicoins individually. Your profits and losses are tracked as percentages for" +
      'each individual melee you participate in. The arena\'s "lock in" feature is a' +
      "rewards mechanism in which your APT deposits are matched up to a certain amount.",
  },
  {
    title: "What does the price chart represent?",
    paragraph:
      "The price chart shows the price of the emojicoin on the left side in " +
      "terms of the emojicoin of the right side. For example, if the price is " +
      "3, that means that one of the emojicoins on the left can buy you " +
      "three of the emojicoins on the right. If the price goes up, to " +
      "4 for example, then one emojicoin on the left can buy you 4 " +
      "emojicoins on the right.",
  },
  {
    title:
      "I participated in a melee but didn't exit before the end of the " +
      "melee. How do I exit a melee that has already ended?",
    paragraph:
      "To exit a melee that has already ended, go to the Profile tab, and " +
      "click the exit button next to the melee you wish to exit. If the exit " +
      "button is not present, it means you already exited that melee.",
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
