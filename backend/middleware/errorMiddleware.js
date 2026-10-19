export const notFound = (req, res, next) => {
    res.status(404).json({
        error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

export const errorHandler = (err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        error: err.status ? err.message : "Internal server error",
    });
};