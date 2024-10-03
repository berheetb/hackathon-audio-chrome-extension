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
        // Use chrome.scripting to either pause or resume the tab based on its current state
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

    return (
        <div className="popup-container">
            <h1>Audible Tabs</h1>
            <ul className="tab-list">
                {audibleTabs.length > 0 ? (
                    audibleTabs.map((tab) => (
                        <li key={tab.id} className="tab-item">
                            <img src={tab.favIconUrl || 'default-icon.png'} alt="Tab Icon" className="tab-icon" />
                            <span className="tab-title">{tab.title}</span>
                            <button
                                className="control-button"
                                onClick={() => toggleTabAudio(tab)}
                            >
                                {tab.playing ? 'Pause' : 'Resume'}
                            </button>
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
