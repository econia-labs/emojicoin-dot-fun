type Info = {
  title: string;
  paragraph: string;
};
const INFO: Info[] = [
  {
    title: "How does this work?",
    paragraph:
      'Help text for error messages should be human-centered and guide the user to a solution. For example, if a user forgets to enter their email address, the error message could say "Enter your email address".',
  },
  {
    title: "How does this work?",
    paragraph:
      'Help text for error messages should be human-centered and guide the user to a solution. For example, if a user forgets to enter their email address, the error message could say "Enter your email address".',
  },
  {
    title: "How does this work?",
    paragraph:
      'Help text for error messages should be human-centered and guide the user to a solution. For example, if a user forgets to enter their email address, the error message could say "Enter your email address".',
  },
  {
    title: "How does this work?",
    paragraph:
      'Help text for error messages should be human-centered and guide the user to a solution. For example, if a user forgets to enter their email address, the error message could say "Enter your email address".',
  },
  {
    title: "How does this work?",
    paragraph:
      'Help text for error messages should be human-centered and guide the user to a solution. For example, if a user forgets to enter their email address, the error message could say "Enter your email address".',
  },
];

export const InfoTab = () => (
  <div className="w-[100%] h-[100%] py-[1em] flex flex-col gap-[2em] max-w-[80ch] m-auto overflow-scroll">
    {INFO.map((i) => (
      <div key={`info-p-${i}`} className="flex flex-col gap-[1em]">
        <div className="text-3xl uppercase text-white">{i.title}</div>
        <div className="font-forma text-light-gray">{i.paragraph}</div>
      </div>
    ))}
  </div>
);
