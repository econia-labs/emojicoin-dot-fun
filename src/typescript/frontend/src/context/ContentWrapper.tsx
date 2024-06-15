export const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col max-w-[100vw] pl-0 pr-0 h-[100vh] overflow-x-hidden">
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
