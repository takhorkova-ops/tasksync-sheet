import { useQuery } from "@tanstack/react-query";

const SPREADSHEET_ID = "1L7U3nYLgYbD9RIsQdiqmi94dxZhQYxolCzRpSBgKYiM";
const API_KEY = "AIzaSyAUA0pHDay0LQ0kebpZtam3-8ZCl_U_mak";

interface SheetData {
  range: string;
  values: string[][];
}

export const useGoogleSheets = (range: string = "Sheet1!A1:Z1000") => {
  return useQuery({
    queryKey: ["googleSheets", range],
    queryFn: async () => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch data from Google Sheets");
      }
      
      const data: SheetData = await response.json();
      return data.values || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
