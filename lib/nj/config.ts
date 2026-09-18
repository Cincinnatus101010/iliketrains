export const config = {
  njUsername: process.env.NJTRANSIT_USERNAME ?? "",
  njPassword: process.env.NJTRANSIT_PASSWORD ?? "",
  tokenUrl:
    process.env.NJTRANSIT_TOKEN_URL ?? "https://raildata.njtransit.com/api/TrainData/getToken",
  apiBaseUrl: process.env.NJTRANSIT_API_BASE_URL ?? "https://raildata.njtransit.com/api/TrainData/",
};

export const njConfigured = Boolean(config.njUsername && config.njPassword);
