import React, { useState, useEffect } from 'react'
import './popup.css' 

const Popup = () => {
    const [audibleTabs, setAudibleTabs] = useState([])
    const [playbackStates, setPlaybackStates] = useState({})

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            queryAudibleTabs()
        } else {
            console.error("Chrome API is not available.")
        }
    }, [])

    // Utility function to convert seconds to MM:SS format
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        const paddedMinutes = String(minutes).padStart(2, '0')
        const paddedSeconds = String(remainingSeconds).padStart(2, '0')
        return `${paddedMinutes}:${paddedSeconds}`
    }

    // Query for all currently audible tabs
    const queryAudibleTabs = async () => {
        try {
            const tabs = await new Promise((resolve) => {
                chrome.tabs.query({ audible: true }, (tabs) => resolve(tabs))
            })

            const tabsWithState = tabs.map((tab) => ({ ...tab, playing: true, volume: 1.0 }))
            setAudibleTabs(tabsWithState)
            tabsWithState.forEach(tab => updatePlaybackState(tab.id)) // Initialize playback states for each tab
        } catch (error) {
            console.error("Error querying audible tabs:", error)
        }
    }

    // Pause or resume a specific tab
    const toggleTabAudio = async (tab) => {
        const { id, playing } = tab

        if (chrome.scripting) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: id },
                    func: toggleMediaPlayback,
                    args: [playing],
                },
                () => {
                    updateTabState(id, !playing) // Update the state after pausing/resuming
                }
            )
        } else {
            console.error("chrome.scripting is not available.")
        }
    }

    // Function injected into the tab to control media playback
    const toggleMediaPlayback = (isPlaying) => {
        const mediaElements = document.querySelectorAll('audio, video')
        mediaElements.forEach((media) => {
            if (isPlaying) {
                media.pause() // Pause audio/video
            } else {
                media.play() // Resume audio/video
            }
        })
    }

    // Update the state of the tab (whether it's playing or paused)
    const updateTabState = (tabId, isPlaying) => {
        setAudibleTabs((prevTabs) =>
            prevTabs.map((tab) =>
                tab.id === tabId ? { ...tab, playing: isPlaying } : tab
            )
        )
    }

    // Update the playback state of a specific tab (get current time, duration, and volume)
    const updatePlaybackState = (tabId) => {
        if (chrome.scripting) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabId },
                    func: getPlaybackState,
                },
                (result) => {
                    if (result && result[0]) {
                        const { currentTime, duration, volume } = result[0].result
                        setPlaybackStates((prevStates) => ({
                            ...prevStates,
                            [tabId]: { currentTime, duration, volume },
                        }))
                    }
                }
            )
        }
    }

    // Function injected into the tab to get the current playback state
    const getPlaybackState = () => {
        const mediaElement = document.querySelector('audio, video')
        if (mediaElement) {
            return {
                currentTime: mediaElement.currentTime,
                duration: mediaElement.duration,
                volume: mediaElement.volume,
            }
        }
        return { currentTime: 0, duration: 0, volume: 1.0 }
    }

    // Seek to a specific time in the media element
    const seekMedia = (tabId, newTime) => {
        if (chrome.scripting) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabId },
                    func: seekToTime,
                    args: [newTime],
                },
                () => {
                    updatePlaybackState(tabId) // Update the playback state after seeking
                }
            )
        }
    }

    // Function injected into the tab to seek to a specific time
    const seekToTime = (newTime) => {
        const mediaElement = document.querySelector('audio, video')
        if (mediaElement) {
            mediaElement.currentTime = newTime
        }
    }

    // Change volume of media in the tab
    const changeTabVolume = (tab, volume) => {
        const { id } = tab
        console.log(`Changing volume for tab: ${id}, volume: ${volume}`)

        if (chrome.scripting) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: id },
                    func: setMediaVolume,
                    args: [volume],
                },
                () => {
                    console.log(`Volume set to ${volume} for tab ${id}`)
                    updateTabVolume(id, volume) // Update the volume state after setting
                }
            )
        } else {
            console.error("chrome.scripting is not available.")
        }
    }

    // Function injected into the tab to control media volume
    const setMediaVolume = (volume) => {
        const mediaElements = document.querySelectorAll('audio, video')
        mediaElements.forEach((media) => {
            media.volume = volume // Set the volume level for each media element
        })
    }

    // Update the volume state of the tab
    const updateTabVolume = (tabId, volume) => {
        setAudibleTabs((prevTabs) =>
            prevTabs.map((tab) =>
                tab.id === tabId ? { ...tab, volume } : tab
            )
        )
    }

    return (
        <div className="popup-container">
            <h1>Audible Tabs</h1>
            <ul className="tab-list">
                {audibleTabs.length > 0 ? (
                    audibleTabs.map((tab) => (
                        <li key={tab.id} className="tab-item">
                            <span className='tab-title-container'>
                                <img src={tab.favIconUrl || 'default-icon.png'} alt="Tab Icon" className="tab-icon" />
                                <span className="tab-title">{tab.title}</span>
                            </span>
                            <button
                                className="control-button"
                                onClick={() => toggleTabAudio(tab)}
                            >
                                {tab.playing ? 'Pause' : 'Resume'}
                            </button>

                            {/* Slider to control volume */}
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={tab.volume}
                                className="volume-slider"
                                onChange={(e) => changeTabVolume(tab, parseFloat(e.target.value))}
                            />

                            {/* Playhead */}
                            {playbackStates[tab.id] && (
                                <div className="playback-container">
                                    <input
                                        type="range"
                                        min="0"
                                        max={playbackStates[tab.id].duration || 0}
                                        value={playbackStates[tab.id].currentTime || 0}
                                        onChange={(e) => seekMedia(tab.id, e.target.value)}
                                    />
                                    <span className="playback-time">
                                        {formatTime(playbackStates[tab.id].currentTime || 0)} / {formatTime(playbackStates[tab.id].duration || 0)}
                                    </span>
                                </div>
                            )}
                        </li>
                    ))
                ) : (
                    <li className="no-tabs">No audible tabs found.</li>
                )}
            </ul>
        </div>
    )
}

export default Popup
