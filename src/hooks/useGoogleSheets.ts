import { useQuery } from "@tanstack/react-query";

const SPREADSHEET_ID = "1L7U3nYLgYbD9RIsQdiqmi94dxZhQYxolCzRpSBgKYiM";
const API_KEY = "AIzaSyAUA0pHDay0LQ0kebpZtam3-8ZCl_U_mak";

interface SheetData {
  range: string;
  values: string[][];
}

export const useGoogleSheets = () => {
  return useQuery({
    queryKey: ["googleSheets"],
    queryFn: async () => {
      // Сначала получаем информацию о таблице, чтобы узнать имя первого листа
      const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
      const metadataResponse = await fetch(metadataUrl);
      
      if (!metadataResponse.ok) {
        throw new Error("Failed to fetch spreadsheet metadata");
      }
      
      const metadata = await metadataResponse.json();
      const firstSheetTitle = metadata.sheets[0]?.properties?.title || "Sheet1";
      
      // Теперь получаем данные из первого листа
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(firstSheetTitle)}?key=${API_KEY}`;
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
