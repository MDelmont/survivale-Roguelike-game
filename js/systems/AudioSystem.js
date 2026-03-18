/**
 * AudioSystem
 * Handles background music and sound effects.
 */
export class AudioSystem {
    constructor() {
        this.music = null;
        this.isMusicPlaying = false;
    }

    /**
     * Plays background music.
     * @param {string} path - URL to the music file.
     * @param {boolean} loop - Whether the music should loop.
     */
    playMusic(path, loop = true) {
        if (this.isMusicPlaying && this.music?.src.includes(path)) return;

        if (this.music) {
            this.music.pause();
            this.music = null;
        }

        this.music = new Audio(path);
        this.music.loop = loop;
        this.music.volume = 0.5; // Default volume

        const playPromise = this.music.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isMusicPlaying = true;
                console.log('Music started:', path);
            }).catch(error => {
                console.warn('Audio playback failed or was blocked by browser:', error);
                this.isMusicPlaying = false;
            });
        }
    }

    /**
     * Stops the music.
     */
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            this.isMusicPlaying = false;
        }
    }

    /**
     * Sets the music volume.
     * @param {number} volume - 0.0 to 1.0.
     */
    setVolume(volume) {
        if (this.music) {
            this.music.volume = Math.max(0, Math.min(1, volume));
        }
    }
}
