export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(" ") });
  }
  if (error.name === "CastError") return res.status(400).json({ message: "Invalid value supplied." });
  res.status(500).json({ message: "Something went wrong on the server." });
}
