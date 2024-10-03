const mockChrome = {
    runtime: {
        sendMessage: (message, callback) => {
            console.log("Mock sendMessage called:", message);
            if (callback) {
                callback({ tabs: [{ id: 1, title: "Mock Tab" }] });
            }
        },
    },
};

export default mockChrome;
