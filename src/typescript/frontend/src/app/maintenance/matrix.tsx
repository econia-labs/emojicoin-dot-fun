/* eslint-disable jsx-a11y/anchor-is-valid */
import useNodeDimensions from '@hooks/use-node-dimensions';
import { getRandomEmoji } from '@sdk/emoji_data';
import React, { useEffect, useRef, useState } from 'react';
import { useInterval } from 'react-use';

// Constants
const STREAM_MUTATION_ODDS = 0.02;

const MIN_STREAM_SIZE = 5;
const MAX_STREAM_SIZE = 10;

const MIN_INTERVAL_DELAY = 50;
const MAX_INTERVAL_DELAY = 100;

const MIN_DELAY_BETWEEN_STREAMS = 0;
const MAX_DELAY_BETWEEN_STREAMS = 8000;

const getRandInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min)) + min;

const getRandChar = () =>
  getRandomEmoji().emoji;

const getRandStream = () =>
  Array.from({length: getRandInRange(MIN_STREAM_SIZE, MAX_STREAM_SIZE)}).map(_ => getRandChar());

const getMutatedStream = stream => {
  const newStream: any[] = [];
  for (let i = 1; i < stream.length; i++) {
    if (Math.random() < STREAM_MUTATION_ODDS) {
      newStream.push(getRandChar());
    } else {
      newStream.push(stream[i]);
    }
  }
  newStream.push(getRandChar());
  return newStream;
};

const RainStream = (props: any) => {
  const [stream, setStream] = useState(getRandStream());
  const [topPadding, setTopPadding] = useState(stream.length * -70);
  const [intervalDelay, setIntervalDelay] = useState<number | null>(null);

  // Initialize intervalDelay
  useEffect(() => {
    setTimeout(() => {
      setIntervalDelay(getRandInRange(MIN_INTERVAL_DELAY, MAX_INTERVAL_DELAY));
    }, getRandInRange(MIN_DELAY_BETWEEN_STREAMS, MAX_DELAY_BETWEEN_STREAMS));
  }, []);

  useInterval(() => {
    if (!props.height) return;

    if (!intervalDelay) return;

    // If stream is off the screen, reset it after timeout
    if (topPadding > props.height) {
      setStream([]);
      const newStream = getRandStream();
      setStream(newStream);
      setTopPadding(newStream.length * -70);
      setIntervalDelay(null);
      setTimeout(
        () =>
          setIntervalDelay(
            getRandInRange(MIN_INTERVAL_DELAY, MAX_INTERVAL_DELAY),
          ),
        getRandInRange(MIN_DELAY_BETWEEN_STREAMS, MAX_DELAY_BETWEEN_STREAMS),
      );
    } else {
      setTopPadding(topPadding + 70);
    }
    // setStream(stream => [...stream.slice(1, stream.length), getRandChar()]);
    setStream(getMutatedStream);
  }, intervalDelay);

  return (
    <div
      style={{
        color: 'var(--ec-blue)',
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        marginTop: topPadding,
        marginLeft: -15,
        marginRight: -15,
        textShadow: '0px 0px 8px var(--ec-blue)',
        fontSize: '44px',
      }} className="px-[40px]">
      {stream.map((char, index) => (
        <a
          style={{
            marginTop: 70 - 44,
            // Reduce opacity for last chars
            opacity: index < 6 ? 0.1 + index * 0.15 : 1,
            color: index === stream.length - 1 ? '#fff' : undefined,
            textShadow:
            index === stream.length - 1
              ? '0px 0px 20px rgba(255, 255, 255, 1)'
              : undefined,
          }}>
          {char}
        </a>
      ))}
    </div>
  );
};

const MatrixRain = props => {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useNodeDimensions(containerRef);

  const streamCount = containerSize ? Math.floor((containerSize.width ?? 0) / 50) : 0;
  console.log({containerSize, streamCount})

  return (
    <div
      style={{
        background: 'black',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        overflow: 'ignore',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
      }}
      ref={containerRef}>
      {Array.from({length: streamCount}).map(_ => (
        <RainStream height={containerSize?.height} />
      ))}
    </div>
  );
};

export default MatrixRain;
