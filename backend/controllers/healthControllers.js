export const getHome = (req, res) => {
    res.json({
        message: "Transaction Anomaly Detection API is running",
    });
};

export const getHealth = (req, res) => {
    res.status(200).json({
        status: "healthy",
    });
};