let accessToken;
const clientID = 'bea1fcbef10e4c35b7ec3e5e53555979';
const redirectURI = 'http://eleanor_jammming.surge.sh/';

// Uses Implicit Grant Flow to setup a user's account and make requests
const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        } 
        
        // Check for access token match
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if (accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1];
            const expiresIn = Number(expiresInMatch[1]);
            
            // This clears the parameters, allowing us to grab a new access token when it expires
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
            window.location = accessUrl;
        }        
    },

    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if (!jsonResponse.tracks) {
                return [];
            }
            return jsonResponse.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },

    savePlaylist(name, trackUris) {
        if (!name || !trackUris.length) {
            return;
        }

        const accessToken = Spotify.getAccessToken();
        const headers = {Authorization: `Bearer ${accessToken}`};
        let userID;
        
        return fetch('https://api.spotify.com/v1/me', {headers: headers}
                    ).then(response => {
                        return response.json();
                    }).then(jsonResponse => {
                        userID = jsonResponse.id;
                        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`,
                                    {   headers: headers,
                                        method: 'POST',
                                        body: JSON.stringify({name: name})
                                    }).then(response => {
                                        return response.json();
                                    }).then(jsonResponse => {
                                        const playlistID = jsonResponse.id;
                                        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`,
                                                    {   headers: headers,
                                                        method: 'POST',
                                                        body: JSON.stringify({uris: trackUris})
                                                    });
                                    });
                        });
    }
};

export default Spotify;