const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      id="content-wrapper"
      className="flex flex-col max-w-[100dvw] pl-0 pr-0 h-[100dvh] overflow-x-hidden"
    >
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  );
};

export default ContentWrapper;
