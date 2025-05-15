// src/components/PersonDataForm.tsx
import React from 'react';

interface PersonData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

interface PersonDataFormProps {
  person: PersonData;
  setPerson: (person: PersonData) => void;
  personNumber: 1 | 2;
  citySuggestions: any[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  fetchCitySuggestions: (value: string) => void;
  suggestionsRef: React.RefObject<HTMLDivElement>;
}

const PersonDataForm: React.FC<PersonDataFormProps> = ({
  person,
  setPerson,
  personNumber,
  citySuggestions,
  showSuggestions,
  setShowSuggestions,
  fetchCitySuggestions,
  suggestionsRef,
}) => {
  const handleInputChange = (field: keyof PersonData, value: string) => {
    setPerson({ ...person, [field]: value });
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,2})/, "$1/$2");
    handleInputChange("birthDate", v);
  };

  const handleBirthTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length > 2) v = v.replace(/(\d{2})(\d{1,2})/, "$1:$2");
    const [hh, mm] = v.split(":");
    let valid = true;
    if (hh && parseInt(hh) > 23) valid = false;
    if (mm && parseInt(mm) > 59) valid = false;
    if (valid) handleInputChange("birthTime", v);
  };

  const handleBirthPlaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange("birthPlace", e.target.value);
    fetchCitySuggestions(e.target.value);
    setShowSuggestions(true);
  };

  return (
    <div className="bg-white bg-opacity-100 rounded-xl shadow-lg p-6 w-full flex flex-col gap-4 border border-gray-200">
      <div className="flex flex-col gap-1">
        <label className="text-black font-semibold text-sm mb-1" htmlFor={`name-${personNumber}`}>Nome</label>
        <input
          id={`name-${personNumber}`}
          type="text"
          placeholder="Nome completo"
          value={person.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black placeholder-gray-400 w-full transition"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-black font-semibold text-sm mb-1" htmlFor={`birthDate-${personNumber}`}>Data de nascimento</label>
        <input
          id={`birthDate-${personNumber}`}
          type="tel"
          placeholder="dd/mm/aaaa"
          value={person.birthDate}
          onChange={handleBirthDateChange}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black placeholder-gray-400 w-full transition"
          required
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-black font-semibold text-sm mb-1" htmlFor={`birthTime-${personNumber}`}>Hora de nascimento</label>
        <input
          id={`birthTime-${personNumber}`}
          type="tel"
          placeholder="hh:mm"
          value={person.birthTime}
          onChange={handleBirthTimeChange}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black placeholder-gray-400 w-full transition"
          required
          pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
          maxLength={5}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1 relative w-full">
        <label className="text-black font-semibold text-sm mb-1" htmlFor={`birthPlace-${personNumber}`}>Cidade de nascimento</label>
        <input
          id={`birthPlace-${personNumber}`}
          type="text"
          placeholder="Cidade de nascimento"
          value={person.birthPlace}
          onChange={handleBirthPlaceChange}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black placeholder-gray-400 w-full transition"
          required
          autoComplete="off"
        />
        {showSuggestions && citySuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 bg-white border border-gray-200 rounded w-full mt-1 max-h-56 overflow-y-auto shadow-lg"
          >
            {citySuggestions.map((s, idx) => (
              <div
                key={idx}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-left text-sm text-black"
                onClick={() => {
                  handleInputChange("birthPlace", s.display_name);
                  setShowSuggestions(false);
                }}
              >
                {s.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonDataForm;
