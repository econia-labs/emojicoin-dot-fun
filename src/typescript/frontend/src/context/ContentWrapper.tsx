const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      id="content-wrapper"
      className="flex h-[100dvh] max-w-[100dvw] flex-col overflow-x-hidden pl-0 pr-0"
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
