import { FunctionComponent, useEffect } from "react";
import { getArtist, doesUserFollowArtist, followArtist, unfollowArtist, getArtistTopTracks, getArtistAlbums } from "../spotify";
import Loader from "../components/Loader";
import { formatWithCommas } from "../utils";
import Track from "../components/Track";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import ErrorFallback from '../components/ErrorFallback'


const Artist: FunctionComponent = () => {
    const { artistId }: any = useParams();

    const { data: artist, isLoading: artistLoading, isError: artistError, refetch: artistRefetch } = useQuery({
        queryKey: ['artist', artistId],
        staleTime: 1000 * 60 * 60 * 24,
        queryFn: async () => {
            const res = await getArtist(artistId);
            return res.data;
        },
    });

    const { data: userFollows, isLoading: userFollowsLoading, refetch: userFollowsRefetch } = useQuery({
        queryKey: ['user-follows', artistId],
        staleTime: 1000 * 60 * 60 * 24,
        queryFn: async () => {
            const res = await doesUserFollowArtist(artistId);
            return res.data[0];
        },
    });

    const { data: topTracks, isLoading: artistTopTracksLoading, isError: artistTopTracksError, refetch:topTracksRefetch } = useQuery({
        queryKey: ['artist-top-tracks', artistId],
        staleTime: 1000 * 60 * 60 * 24,
        queryFn: async () => {
            const res = await getArtistTopTracks(artistId);
            return res.data.tracks;
        }
    })

    const { data: albums, isLoading: artistAlbumsLoading, isError: artistAlbumsError, refetch:albumsRefetch } = useQuery({
        queryKey: ['artist-albums', artistId],
        staleTime: 1000 * 60 * 30,
        queryFn: async () => {
            const res = await getArtistAlbums(artistId);
            return res.data.items;
        }
    })

    useEffect(() => {
        document.title = `${artistLoading ? "Artist" : artist.name} • SpotiStat`;
    }, [artist])

    const handleFollow = useMutation({
        mutationFn: async () => userFollows ? await unfollowArtist(artistId) : await followArtist(artistId),
        onSuccess: () => {
            userFollowsRefetch();
        }
    })

    const getPlayableSong = () => {
        let idx = 0;
        while (idx < 10) {
            if (topTracks[idx].preview_url) {
                // console.log(topTracks[idx].preview_url);
                return topTracks[idx].preview_url;
            } else {
                idx++;
            }
        }
    }


    return (
        <div>
            {artistLoading ? <Loader /> : artistError ? <ErrorFallback refetch={artistRefetch} /> :
                <div className="m-auto w-full lg:px-24 md:px-12 px-6 my-16 text-white">
                    <div className="flex items-center justify-center flex-col">
                        <img src={artist.images[0].url} alt={artist.name} className="lg:h-64 md:h-52 w-48 lg:w-64 md:w-52 h-48 rounded-full" />
                        <a href={artist.external_urls.spotify} target="_blank" className="lg:text-6xl md:text-5xl text-4xl font-bold my-7 hover:text-green-500">{artist.name}</a>
                        <div className="mb-7">
                            <button onClick={() => handleFollow.mutate()} className="text-white border px-9 py-2.5 rounded-full text-sm hover:text-black hover:bg-white">
                                {
                                    !userFollowsLoading && userFollows ? 'FOLLOWING' : 'FOLLOW'
                                }
                            </button>
                        </div>
                        <div className="flex flex-wrap justify-center mt-4 gap-24">
                            <div className="flex flex-col items-center">
                                <p className="text-blue-500 lg:text-3xl md:3xl text-2xl font-bold">{formatWithCommas(artist.followers.total)}</p>
                                <p className="text-gray-500">FOLLOWERS</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <p className="text-blue-500 lg:text-3xl md:3xl text-2xl font-bold">{artist.popularity}%</p>
                                <p className="text-gray-500">POPULARITY</p>
                            </div>
                        </div>
                        <div className="my-10">
                            <div>
                                <p className="text-blue-500 lg:text-2xl md:2xl text-xl text-center font-bold">{artist.genres.length > 0 ? artist.genres.map((genre: any, i: number) => (
                                    genre + (i < artist.genres.length - 1 ? ', ' : '')
                                )) : 'Unavailable'}</p>
                                <p className="text-gray-500 text-center">GENRES</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <p className="lg:text-3xl text-2xl font-bold">Top Tracks</p>
                    </div>

                    {
                        artistTopTracksLoading ? <Loader /> : artistTopTracksError ? <ErrorFallback refetch={topTracksRefetch} /> : <div>
                            <div className="my-5">
                                <audio autoPlay loop>
                                    <source src={getPlayableSong()}></source>
                                </audio>
                            </div>

                            <div className="flex flex-wrap gap-7 my-10">
                                {topTracks.map((track: any, i: number) => (
                                    <Track key={i} trackId={track.id} trackAlbum={track.album.name} trackArtists={track.album.artists} trackDuration={track.duration_ms} trackPlayedAt={""} trackImage={track.album.images[2]?.url} trackName={'#' + (i + 1) + " " + track.name} tractAlbumId={track.album.id} />
                                ))}
                            </div>
                        </div>
                    }


                    <div className="pt-10">
                        <p className="text-3xl font-extrabold">Albums</p>
                    </div>
                    <div className="grid lg:grid-cols-[minmax(100px,_1fr),minmax(100px,_1fr),minmax(100px,_1fr),minmax(100px,_1fr),minmax(100px,_1fr)] md:grid-cols-[minmax(100px,_1fr),minmax(100px,_1fr),minmax(100px,_1fr),minmax(100px,_1fr)] grid-cols-[minmax(100px,_1fr),minmax(100px,_1fr)] lg:gap-8 md:gap-7 gap-6 my-10">
                        {artistAlbumsLoading ? <Loader /> : artistAlbumsError ? <ErrorFallback refetch={albumsRefetch} /> : albums.map((album: any, i: number) => (
                            <div key={i}>
                                <Link to={`/album/${album.id}`}>
                                    <div className="track-card">
                                        <img src={album.images[1].url ? album.images[0].url : 'https://maheshwaricollege.ac.in/publicimages/thumb/members/400x400/mgps_file_d11584807164.jpg'} className="rounded-md" alt="Album Cover" />
                                    </div>
                                </Link>
                                <p className="text-base font-semibold mt-2">{(album.name ? album.name : 'Playlist Unavailable')}</p>
                                <p className="text-xs text-green-500 my-1">By {
                                    album.artists.map((artist: any, i: number) => (
                                        <span key={i}>
                                            <Link className="hover:underline text-green-500" to={`/artist/${artist.id}`}>
                                                {artist.name}
                                            </Link>
                                            {(i < album.artists.length - 1 ? ', ' : '')}
                                        </span>
                                    ))
                                }</p>
                                <p className="text-sm text-gray-500">{album.total_tracks} {
                                    album.total_tracks > 1 ? 'SONGS' : 'SONG'
                                }</p>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    );
}

export default Artist;