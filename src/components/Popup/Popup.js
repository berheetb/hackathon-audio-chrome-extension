import React, { useState, useEffect } from 'react';
import './popup.css'; 

const Popup = () => {
    const [audibleTabs, setAudibleTabs] = useState([]);

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            queryAudibleTabs();
        } else {
            console.error("Chrome API is not available.");
        }
    }, []);

    // Query for all currently audible tabs
    const queryAudibleTabs = async () => {
        try {
            const tabs = await new Promise((resolve) => {
                chrome.tabs.query({ audible: true }, (tabs) => resolve(tabs));
            });

            const tabsWithState = tabs.map((tab) => ({ ...tab, playing: true }));
            setAudibleTabs(tabsWithState);
        } catch (error) {
            console.error("Error querying audible tabs:", error);
        }
    };

    // Pause or resume a specific tab
    const toggleTabAudio = async (tab) => {
        const { id, playing } = tab;

        // Add a log to see if button click is working
        console.log(`Toggling audio for tab: ${id}, currently ${playing ? 'playing' : 'paused'}`);
        console.log(tab)

        if (chrome.scripting) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: id },
                    func: toggleMediaPlayback,
                    args: [playing],
                },
                () => {
                    console.log(`Tab ${id} ${playing ? 'paused' : 'resumed'}.`);
                    updateTabState(id, !playing); // Update the state after pausing/resuming
                }
            );
        } else {
            console.error("chrome.scripting is not available.");
        }
    };

    // Function injected into the tab to control media playback
    const toggleMediaPlayback = (isPlaying) => {
        const mediaElements = document.querySelectorAll('audio, video');
        mediaElements.forEach((media) => {
            if (isPlaying) {
                console.log('Pausing media');
                media.pause(); // Pause audio/video
            } else {
                console.log('Resuming media');
                media.play(); // Resume audio/video
            }
        });
    };

    // Update the state of the tab (whether it's playing or paused)
    const updateTabState = (tabId, isPlaying) => {
        setAudibleTabs((prevTabs) =>
            prevTabs.map((tab) =>
                tab.id === tabId ? { ...tab, playing: isPlaying } : tab
            )
        );
    };

    // Change volume of media in the tab
    const changeTabVolume = (tab, volume) => {
        const { id } = tab;
        console.log(`Changing volume for tab: ${id}, volume: ${volume}`);

        if (chrome.scripting) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: id },
                    func: setMediaVolume,
                    args: [volume],
                },
                () => {
                    console.log(`Volume set to ${volume} for tab ${id}`);
                    updateTabVolume(id, volume); // Update the volume state after setting
                }
            );
        } else {
            console.error("chrome.scripting is not available.");
        }
    };

    // Function injected into the tab to control media volume
    const setMediaVolume = (volume) => {
        const mediaElements = document.querySelectorAll('audio, video');
        mediaElements.forEach((media) => {
            media.volume = volume; // Set the volume level for each media element
        });
    };

    // Update the volume state of the tab
    const updateTabVolume = (tabId, volume) => {
        setAudibleTabs((prevTabs) =>
            prevTabs.map((tab) =>
                tab.id === tabId ? { ...tab, volume } : tab
            )
        );
    };

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
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={tab.volume}
                                className="volume-slider"
                                onChange={(e) => changeTabVolume(tab, parseFloat(e.target.value))}
                            />
                        </li>
                    ))
                ) : (
                    <li className="no-tabs">No audible tabs found.</li>
                )}
            </ul>
        </div>
    );
};

export default Popup;
