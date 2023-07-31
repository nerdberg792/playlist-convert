import React, { useState } from 'react';
import './MainPage.css';

const MainPage = () => {
  const [playlistLink, setPlaylistLink] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');

  const extractPlaylistId = (link) => {
    const regex = /(?:\/|list=)([a-zA-Z0-9_-]+)/;
    const match = link.match(regex);
    return match && match[1] ? match[1] : null;
  };

  const fetchPlaylistVideoTitles = async (playlistId, apiKey) => {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&key=${apiKey}&part=snippet&fields=items(snippet(title))&maxResults=50`;
  
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
          
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const videoTitles = data.items.map(item => item.snippet.title);
      return videoTitles;
    } catch (error) {
      console.error('Error:', error.message);
      return [];
    }
  };































  const handleConvertPlaylist = async () => {
    try {
      const playlistId = extractPlaylistId(playlistLink);
      if (!playlistId) {
        alert('Invalid YouTube playlist link. Please enter a valid link.');
        return;
      }

      const clientId = '83496ee403094b4aa83b222309dae90c'; // Replace with your Spotify Client ID
      const clientSecret = '8ebfdedbf2bc412aa5cff5d59efcb84d'; // Replace with your Spotify Client Secret

      const response = await fetch('http://localhost:3000/convert-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playlistId: playlistId, clientSecret: clientSecret, clientId: clientId })
      });

      if (!response.ok) {
        throw new Error('Failed to convert playlist');
      }

      const data = await response.json();
      setSpotifyLink(data.spotifyPlaylistLink);
    } catch (error) {
      console.error('Error:', error.message);
      alert('Failed to convert playlist. Please try again later.');
    }
  };
  
    return (
      <div className="container">
        <h1>Playlist Converter API</h1>
        <p>The Node.js API for playlist conversion offers a seamless solution for converting YouTube playlists into Spotify playlists. This API leverages the power of Node.js, along with popular libraries and APIs such as the YouTube Data API and the Spotify Web API. By integrating with these platforms, the API enables users to provide a YouTube playlist link as input and obtain a corresponding Spotify playlist link as output. Through efficient data retrieval, transformation, and synchronization processes, the API ensures that the converted Spotify playlist accurately represents the songs from the original YouTube playlist. This Node.js API simplifies the task of playlist conversion, providing developers and users with a convenient and reliable method to migrate their favorite YouTube playlists to Spotify effortlessly.</p>
      <div className="input-container">
        <input
          type="text"
          placeholder="Your YouTube Playlist Link"
          value={playlistLink}
          onChange={(e) => setPlaylistLink(e.target.value)}
        />
        <button onClick={handleConvertPlaylist}>Convert</button>
      </div>
      {spotifyLink && (
        <div className="result-container">
          <p>Spotify Link:</p>
          <a href={spotifyLink} target="_blank" rel="noopener noreferrer">
            {spotifyLink}
          </a>
        </div>
      )}
      <div className="developer-link">
        <p>About the developer: <a href="https://www.example.com">Example Dev</a></p>
      </div>
    </div>
  );
};
export default MainPage ; 