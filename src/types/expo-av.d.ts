declare module 'expo-av' {
  export enum InterruptionModeIOS {
    MixWithOthers = 0,
    DoNotMix = 1,
    DuckOthers = 2,
  }

  export enum InterruptionModeAndroid {
    DoNotMix = 1,
    DuckOthers = 2,
  }

  export namespace Audio {
    class Sound {
      static createAsync(
        source: number,
        initialStatus?: { shouldPlay?: boolean }
      ): Promise<{ sound: Sound }>;
      stopAsync(): Promise<void>;
      unloadAsync(): Promise<void>;
    }

    function setAudioModeAsync(mode: {
      allowsRecordingIOS?: boolean;
      staysActiveInBackground?: boolean;
      playsInSilentModeIOS?: boolean;
      shouldDuckAndroid?: boolean;
      interruptionModeIOS?: InterruptionModeIOS;
      interruptionModeAndroid?: InterruptionModeAndroid;
      playThroughEarpieceAndroid?: boolean;
    }): Promise<void>;
  }
}
