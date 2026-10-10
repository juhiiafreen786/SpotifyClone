import { useState, useRef, useEffect } from "react";
import "./App.css";

const defaultSongs = [
  {
    id: 1,
    title: "Today's Top Hits",
    artist: "Spotify",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500",
    audio:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "Chill Vibes",
    artist: "Spotify",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
    audio:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "Hot Hits",
    artist: "Spotify",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500",
    audio:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: 4,
    title: "Love Songs",
    artist: "Spotify",
    image:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500",
    audio:
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
];

const playlists = [
  {
    id: 1,
    name: "My Playlist #1",
    emoji: "🎵",
    songs: defaultSongs.slice(0, 2),
  },
  {
    id: 2,
    name: "Chill Vibes",
    emoji: "🎧",
    songs: defaultSongs.slice(1, 4),
  },
  {
    id: 3,
    name: "Workout Music",
    emoji: "🔥",
    songs: defaultSongs,
  },
];

function App() {
  const [songs, setSongs] = useState(defaultSongs);
  const [currentSong, setCurrentSong] = useState(defaultSongs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const audioRef = useRef(null);
  const searchTimer = useRef(null);

  // PLAY / PAUSE
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong?.audio) {
      audio.pause();
      return;
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    const playAudio = async () => {
      try {
        await audio.play();
      } catch (error) {
        console.error("Audio playback error:", error);
        setIsPlaying(false);
      }
    };

    if (audio.readyState >= 2) {
      playAudio();
    } else {
      const handleCanPlay = () => {
        playAudio();
      };

      audio.addEventListener("canplay", handleCanPlay, { once: true });
      audio.load();

      return () => {
        audio.removeEventListener("canplay", handleCanPlay);
      };
    }
  }, [isPlaying, currentSong]);

  // PROGRESS
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("timeupdate", updateProgress);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
    };
  }, [currentSong]);

  // PLAY SONG
  const playSong = (song) => {
    if (!song.audio) {
      alert("Is song ka preview available nahi hai.");
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);
    setProgress(0);
  };

  // NEXT
  const nextSong = () => {
    if (songs.length === 0) return;

    const currentIndex = songs.findIndex(
      (song) => song.id === currentSong.id
    );

    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + 1) % songs.length;

    setCurrentSong(songs[nextIndex]);
    setProgress(0);
    setIsPlaying(true);
  };

  // PREVIOUS
  const previousSong = () => {
    if (songs.length === 0) return;

    const currentIndex = songs.findIndex(
      (song) => song.id === currentSong.id
    );

    const previousIndex =
      currentIndex === -1
        ? 0
        : (currentIndex - 1 + songs.length) % songs.length;

    setCurrentSong(songs[previousIndex]);
    setProgress(0);
    setIsPlaying(true);
  };

  // AUTO NEXT
  const handleSongEnded = () => {
    nextSong();
  };

  // SEARCH MUSIC ONLINE

  const searchMusic = async (query) => {
    if (!query.trim()) {
      setSongs(defaultSongs);
      setCurrentSong(defaultSongs[0]);
      setIsPlaying(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=50&country=IN`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      console.log("iTunes results:", data);

      const onlineSongs = (data.results || [])
        .filter((song) => song.previewUrl)
        .filter((song) => {
          const isBlockedSong =
            song.trackName?.toLowerCase() === "tere liye" &&
            song.artistName?.toLowerCase() === "atif aslam";

          return !isBlockedSong;
        })
        .map((song) => ({
          id: song.trackId,
          title: song.trackName,
          artist: song.artistName,
          image:
            song.artworkUrl100 ||
            "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500",
          audio: `/api/itunes-audio?url=${encodeURIComponent(song.previewUrl)}`,
          album: song.collectionName || "Unknown Album",
          storeUrl: song.trackViewUrl,
        }));

      console.log("Songs found:", onlineSongs);

      setSongs(onlineSongs);

      if (onlineSongs.length > 0) {
        setCurrentSong(onlineSongs[0]);
        setProgress(0);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSongs([]);
    }

    setLoading(false);
  };






  // SEARCH INPUT
  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearch(value);

    // Purana timer cancel
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    if (!value.trim()) {
      setSongs(defaultSongs);
      setCurrentSong(defaultSongs[0]);
      setIsPlaying(false);
      setLoading(false);
      return;
    }

    // Har letter par API call nahi hogi
    searchTimer.current = setTimeout(() => {
      searchMusic(value);
    }, 500);
  };

  // HOME
  const openHome = () => {
    setShowSearch(false);
    setShowLibrary(false);
    setSelectedPlaylist(null);
  };

  // SEARCH
  const openSearch = () => {
    setShowSearch(true);
    setShowLibrary(false);
    setSelectedPlaylist(null);
  };

  // LIBRARY
  const openLibrary = () => {
    setShowSearch(false);
    setShowLibrary(true);
    setSelectedPlaylist(null);
  };

  // PLAYLIST
  const openPlaylist = (playlist) => {
    setShowSearch(false);
    setShowLibrary(true);
    setSelectedPlaylist(playlist);
  };

  return (
    <div className="spotify-app">

      {/* AUDIO PLAYER */}
      <audio
        ref={audioRef}
        src={currentSong?.audio || ""}
        preload="auto"
        onEnded={handleSongEnded}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;

          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        }}
        onError={(e) => {
          console.error("Audio failed:", e.currentTarget.error);
        }}
      />

      {/* SIDEBAR */}
      <aside className="sidebar">

        <h1 className="logo">Spotify</h1>

        <nav>

          <div
            className={`nav-item ${!showSearch && !showLibrary ? "active" : ""
              }`}
            onClick={openHome}
          >
            🏠 <span>Home</span>
          </div>

          <div
            className={`nav-item ${showSearch ? "active" : ""}`}
            onClick={openSearch}
          >
            🔍 <span>Search</span>
          </div>

          <div
            className={`nav-item ${showLibrary ? "active" : ""}`}
            onClick={openLibrary}
          >
            📚 <span>Your Library</span>
          </div>

        </nav>

        {/* PLAYLISTS */}
        <div className="playlist-section">

          <p>YOUR PLAYLISTS</p>

          {playlists.map((playlist) => (
            <div
              className="playlist"
              key={playlist.id}
              onClick={() => openPlaylist(playlist)}
            >
              {playlist.emoji} {playlist.name}
            </div>
          ))}

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* SEARCH PAGE */}
        {showSearch && !showLibrary && (

          <div className="search-page">

            <h2>Search</h2>

            <input
              className="search-input"
              type="text"
              placeholder="Search any singer or song..."
              value={search}
              onChange={handleSearchChange}
              autoFocus
            />

            <h2 className="search-heading">
              {search
                ? `Results for "${search}"`
                : "Search your favourite singer"}
            </h2>

            {loading ? (

              <div className="no-results">
                <h3>Searching music...</h3>
                <p>Please wait.</p>
              </div>

            ) : songs.length > 0 ? (

              <div className="song-grid">

                {songs.map((song) => (

                  <div
                    className="song-card"
                    key={song.id}
                    onClick={() => playSong(song)}
                  >

                    <img
                      className="big-album"
                      src={song.image}
                      alt={song.title}
                    />

                    <h3>{song.title}</h3>

                    <p>{song.artist}</p>
                    {song.storeUrl && (
                      <a
                        href={song.storeUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open in Apple Music
                      </a>
                    )}
                  </div>

                ))}

              </div>

            ) : (

              <div className="no-results">
                <h3>No songs found</h3>
                <p>Try another singer or song.</p>
              </div>

            )}

          </div>

        )}

        {/* LIBRARY PAGE */}
        {showLibrary && (

          <div className="library-page">

            {!selectedPlaylist ? (

              <>

                <h2>Your Library</h2>

                <div className="library-grid">

                  {playlists.map((playlist) => (

                    <div
                      className="library-card"
                      key={playlist.id}
                      onClick={() => openPlaylist(playlist)}
                    >

                      <div className="library-image">
                        {playlist.emoji}
                      </div>

                      <h3>{playlist.name}</h3>

                      <p>
                        {playlist.songs.length} songs
                      </p>

                    </div>

                  ))}

                </div>

              </>

            ) : (

              <>

                <button
                  className="back-button"
                  onClick={openLibrary}
                >
                  ← Back to Library
                </button>

                <div className="playlist-header">

                  <div className="playlist-cover">
                    {selectedPlaylist.emoji}
                  </div>

                  <div>

                    <p>PLAYLIST</p>

                    <h1>{selectedPlaylist.name}</h1>

                    <p>
                      {selectedPlaylist.songs.length} songs
                    </p>

                  </div>

                </div>

                <div className="playlist-songs">

                  {selectedPlaylist.songs.map((song, index) => (

                    <div
                      className="playlist-song"
                      key={`${selectedPlaylist.id}-${song.id}`}
                      onClick={() => playSong(song)}
                    >

                      <span>{index + 1}</span>

                      <img
                        src={song.image}
                        alt={song.title}
                      />

                      <div className="playlist-song-info">

                        <strong>{song.title}</strong>

                        <p>{song.artist}</p>

                      </div>

                      <button>▶</button>

                    </div>

                  ))}

                </div>

              </>

            )}

          </div>

        )}

        {/* HOME PAGE */}
        {!showSearch && !showLibrary && (

          <>

            <div className="top-bar">

              <button>‹</button>
              <button>›</button>

            </div>

            <h2>Good evening</h2>

            <div className="quick-play">

              {songs.slice(0, 3).map((song) => (

                <div
                  className="quick-card"
                  key={song.id}
                  onClick={() => playSong(song)}
                >

                  <img
                    className="album-image"
                    src={song.image}
                    alt={song.title}
                  />

                  <span>{song.title}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSong(song);
                    }}
                  >
                    ▶
                  </button>

                </div>

              ))}

            </div>

            <h2>Made for you</h2>

            <div className="song-grid">

              {songs.map((song) => (

                <div
                  className="song-card"
                  key={song.id}
                  onClick={() => playSong(song)}
                >

                  <img
                    className="big-album"
                    src={song.image}
                    alt={song.title}
                  />

                  <h3>{song.title}</h3>

                  <p>{song.artist}</p>

                </div>

              ))}

            </div>

          </>

        )}

      </main>

      {/* PLAYER */}
      <footer className="player">

        <div className="now-playing">

          <img
            className="mini-album"
            src={currentSong.image}
            alt={currentSong.title}
          />

          <div>

            <strong>{currentSong.title}</strong>

            <p>{currentSong.artist}</p>

          </div>

        </div>

        <div className="player-controls">

          <div className="controls">

            <button onClick={previousSong}>
              ⏮
            </button>

            <button
              className="play-button"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            <button onClick={nextSong}>
              ⏭
            </button>

          </div>

          <div className="progress">

            <span>0:00</span>

            <div className="progress-bar">

              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              ></div>

            </div>

            <span>0:30</span>

          </div>

        </div>

        <div className="volume">
          🔊 ━━━━━
        </div>

      </footer>

    </div>
  );
}

export default App;