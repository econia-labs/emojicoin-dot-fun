import ArenaClientSync from "./client-sync";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <ArenaClientSync />
      {children}
    </>
  );
}
