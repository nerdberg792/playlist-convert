import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors'; 
const app = express();
app.use(bodyParser.json());
app.use(cors()) ;

let playlistData  ; 

const searchSpotifySongs = async (accessToken, songNames) => {
    const songURIs = [];
  
    for (const songName of Object.values(songNames)) {
      const searchTerm = encodeURIComponent(`track:${songName}`);
      const apiUrl = `https://api.spotify.com/v1/search?q=${searchTerm}&type=track&limit=1`;
  
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          if (data.tracks.items.length > 0) {
            songURIs.push(data.tracks.items[0].uri);
          }
        } else {
          console.error(`Failed to search for song: ${songName}`);
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    }
  
    return songURIs;
  };
  
  
  
  
  
  
  
 //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 const addSongsToSpotifyPlaylist = async (accessToken, playlistId, songURIs) => {
    const apiUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: songURIs,
          position: 0,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add songs to Spotify playlist');
      }
  
      const playlistUrl = `https://api.spotify.com/v1/playlists/${playlistId}`;
    const playlistResponse = await fetch(playlistUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!playlistResponse.ok) {
      throw new Error('Failed to fetch playlist details');
    }

    const playlistData = await playlistResponse.json();
    const playlistExternalUrl = playlistData.external_urls.spotify;
    return playlistExternalUrl;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
};

  
  /////////////////////////////////////////////////////////
  
  
  ///////////////////////////////////////////////////////////////////////////////
  
  
  
  
  
  
  
 




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
const fetchSpotifyUserProfile = async (accessToken) => {
    const apiUrl = 'https://api.spotify.com/v1/me';
  
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch Spotify user profile');
      }
  
      const data = await response.json();
      return data.id; // Return the user_id from the profile data
    } catch (error) {
      console.error('Error:', error.message);
      return null;
    }
  };
  

      //////////////////////////////////////////////////////////////////////////////////  
  
const requestSpotifyAccessToken = async (code) => {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const requestBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code : code,
    redirect_uri :'http://localhost:3000/callback' , 
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: requestBody
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const createSpotifyPlaylist = async (accessToken, playlistName, playlistDescription, isPublic,user_id) => {
  const apiUrl = `https://api.spotify.com/v1/users/${user_id}/playlists`
  const requestBody = JSON.stringify({
    name: playlistName,
    description: playlistDescription,
    public: isPublic
  });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });
    const data = await response.json();
    
    if (!response.ok) {
    
      throw new Error('Failed to create Spotify playlist');
      
    }

    
    return data.id;
  } catch (error) {
    
    console.error('Error:', error.message);
    return null;
  }
};



///////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/convert-playlist', async (req, res) => {
  const { playlistID, client_secret, client_id } = req.body;

  try {
    const apiKey = 'AIzaSyDUb4exZG6ps2QRvQ1ri7QbtReA7i2dZ-Y'; // Replace with your actual YouTube Data API key
    playlistData = await fetchPlaylistVideoTitles(playlistID, apiKey);
    


    const redirectUri = 'http://localhost:3000/callback'; // Replace this with your actual redirect URI
    const state = 'YOUR_RANDOM_STATE'; // Replace this with your randomly generated state
    const scope = 'playlist-modify-private'; // Specify the required scope
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    res.redirect(authUrl);
    
}catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }});


app.post('/callback',async(req,res)=>{
   const {code , state} = req.query 
   try{
    
    const accessToken = await requestSpotifyAccessToken(code);
    if (!accessToken) {
      res.status(500).json({ error: 'Failed to get Spotify access token' });
      console.log("failed to retrive the access token")
      return;
    }
    const user_id = await fetchSpotifyUserProfile(accessToken)
    if (!user_id) {
        res.status(500).json({ error: 'Failed to get Spotify user id' });
        console.log("failed to retrive the user id")
        return;
      } 
    const playlist_id = await createSpotifyPlaylist(accessToken, "newYTPL", "playlistDescription", true ,user_id)
    const songURI = await searchSpotifySongs(accessToken, playlistData) ; 
    const result = await addSongsToSpotifyPlaylist (accessToken, playlist_id, songURI)
    res.json({ result: result });
} catch (error) {
  console.error('Error:', error.message);
  res.status(500).json({ error: 'Internal Server Error' });
}
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
