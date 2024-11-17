"use client";

interface PageProps {
  params: {
    data: string;
  };
  searchParams: {};
}

export default function GenerateQRCode(props: PageProps) {
  const data = props.params.data;

  return (
    <div className="h-[100%] w-[100%] grid items-center">
      <div className="text-center pixel-heading-2 text-white">data: {data}</div>
    </div>
  );
}
