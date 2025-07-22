import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n, languages, type Language } from "@/lib/i18n";

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
      <SelectTrigger className="w-auto min-w-[120px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline">{languages[language]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            <span className="flex items-center gap-2">
              <span>{name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
