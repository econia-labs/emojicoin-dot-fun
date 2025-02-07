export const NominalPriceDisplay = ({ price }: { price: number }) => {
  const fixed = price.toFixed(8);
  const firstSigFigOnwards = fixed.match(/[1-9].*/)?.at(0) ?? "";
  const beforeSigFig = fixed.slice(0, fixed.length - firstSigFigOnwards.length);
  return (
    <>
      <span className="text-dark-gray">{beforeSigFig}</span>
      <span className="text-lighter-gray">{firstSigFigOnwards}</span>
    </>
  );
};
