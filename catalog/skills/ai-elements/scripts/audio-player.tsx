"use client";

import type { Experimental_SpeechResult as SpeechResult } from "ai";

import {
  AudioPlayer,
  AudioPlayerControlBar,
  AudioPlayerDurationDisplay,
  AudioPlayerElement,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerVolumeRange,
} from "@/components/ai-elements/audio-player";
import { useMemo } from "react";

const Example = () => {
  const data = useMemo<SpeechResult["audio"]>(() => {
    const bytes = new Uint8Array([73, 68, 51, 3, 0, 0, 0, 0, 0, 0]);
    return {
      base64: "SUQzAwAAAAAA",
      format: "mp3",
      mediaType: "audio/mpeg",
      uint8Array: bytes,
    };
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex size-full items-center justify-center">
      <AudioPlayer>
        <AudioPlayerElement data={data} />
        <AudioPlayerControlBar>
          <AudioPlayerPlayButton />
          <AudioPlayerSeekBackwardButton seekOffset={10} />
          <AudioPlayerSeekForwardButton seekOffset={10} />
          <AudioPlayerTimeDisplay />
          <AudioPlayerTimeRange />
          <AudioPlayerDurationDisplay />
          <AudioPlayerMuteButton />
          <AudioPlayerVolumeRange />
        </AudioPlayerControlBar>
      </AudioPlayer>
    </div>
  );
};

export default Example;
