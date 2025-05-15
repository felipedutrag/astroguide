"use client";

import React, { useState, useRef, useEffect } from "react";
import SinastriaModal from "../components/SinastriaModal";

// Define a type for chat messages consistent with the backend
type ChatMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

export default function Home() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Estados para multi-step Sinastria
  const [step, setStep] = useState(1);
  const [person1, setPerson1] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [person2, setPerson2] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [result1, setResult1] = useState<any>(null);
  const [result2, setResult2] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Estados para o chat de sinastria
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]); // Updated chat state
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const fetchWithTimeout = async (
    url: string,
    options = {},
    timeout = 8000
  ) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const fetchCityData = async (city: string) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      city
    )}&format=json&addressdetails=1&limit=1`;

    try {
      const res = await fetchWithTimeout(url, {
        headers: {
          "User-Agent": "astroguide-app/1.0",
          "Accept-Language": "pt-BR,pt;q=0.9",
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar dados da cidade.");
      }

      const data = await res.json();
      if (data.length === 0) {
        throw new Error("Cidade não encontrada.");
      }

      const { lat, lon } = data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    } catch (error: any) {
      console.error("Erro ao buscar dadods:", error);
      throw new Error(error.message || "Erro ao buscar dados da cidade.");
    }
  };

  const fetchPersonData = async (person: typeof person1) => {
    let dateParts = person.birthDate.split("/");
    if (dateParts.length !== 3)
      throw new Error("Data de nascimento inválida. Use o formato dd/mm/aaaa.");
    const formattedBirthDate = `${dateParts[2]}-${dateParts[1].padStart(
      2,
      "0"
    )}-${dateParts[0].padStart(2, "0")}`;
    let timeParts = person.birthTime.split(":");
    if (timeParts.length !== 2)
      throw new Error("Hora de nascimento inválida. Use o formato hh:mm.");
    const formattedBirthTime = `${timeParts[0].padStart(
      2,
      "0"
    )}:${timeParts[1].padStart(2, "0")}`;
    const cityData = await fetchCityData(person.birthPlace);
    const { lat, lon } = cityData;
    const res = await fetchWithTimeout("/api/planetaryPositions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      body: JSON.stringify({
        birthDate: formattedBirthDate,
        birthTime: formattedBirthTime,
        lat,
        lon,
      }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Erro ao interpretar resposta da API.");
    }
    if (!res.ok) throw new Error(data?.error || "Erro ao gerar mapa astral.");
    return data;
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 1) {
      if (
        !person1.name ||
        !person1.birthDate ||
        !person1.birthTime ||
        !person1.birthPlace
      ) {
        setError("Preencha todos os campos da Pessoa 1.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (
        !person2.name ||
        !person2.birthDate ||
        !person2.birthTime ||
        !person2.birthPlace
      ) {
        setError("Preencha todos os campos da Pessoa 2.");
        return;
      }
      setLoading(true);
      try {
        const data1 = await fetchPersonData(person1);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const data2 = await fetchPersonData(person2);
        setResult1(data1);
        setResult2(data2);
        setShowModal(true);
        setStep(3);
      } catch (err: any) {
        setError(err?.message || "Erro ao gerar mapas.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const fetchCitySuggestions = async (value: string) => {
    if (value.length < 2) {
      setCitySuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          value
        )}&format=json&addressdetails=1&limit=3`
      );
      if (res.ok) {
        const data = await res.json();
        const suggestions = data.map((item: any) => {
          const city =
            item.address.city ||
            item.address.town ||
            item.address.village ||
            item.address.hamlet ||
            item.address.county ||
            "";
          const state =
            item.address.state ||
            item.address.region ||
            item.address.state_district ||
            "";
          return {
            ...item,
            display_name: [city, state].filter(Boolean).join(", "),
          };
        });
        setCitySuggestions(suggestions);
      } else {
        setCitySuggestions([]);
      }
    } catch {
      setCitySuggestions([]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showModal && step === 3) {
      setChatHistory([]);
    }
  }, [showModal, step]);

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsgText = chatInput.trim();
    const newUserMessage: ChatMessage = { role: "user", parts: [{ text: userMsgText }] };

    setChatHistory((prevHistory) => [...prevHistory, newUserMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const requestBody: any = {
        userQuestion: userMsgText,
        chatHistory: chatHistory,
      };

      if (chatHistory.length === 0) {
        requestBody.person1 = person1;
        requestBody.person2 = person2;
        requestBody.result1 = result1;
        requestBody.result2 = result2;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorResponseMessage: ChatMessage = {
          role: "model",
          parts: [
            {
              text: `Erro Gemini: ${data.error || "Erro desconhecido"}\n${
                data.details || ""
              }`,
            },
          ],
        };
        setChatHistory((prevHistory) => [...prevHistory, errorResponseMessage]);
      } else {
        if (data.chatHistory) {
          setChatHistory(data.chatHistory);
        } else {
          const modelResponseMessage: ChatMessage = {
            role: "model",
            parts: [{ text: data.response || "(Sem resposta)" }],
          };
          setChatHistory((prevHistory) => [...prevHistory, modelResponseMessage]);
        }
      }
    } catch (err: any) {
      const networkErrorMessage: ChatMessage = {
        role: "model",
        parts: [
          {
            text: "Erro ao conectar com o servidor Gemini. Verifique sua conexão.",
          },
        ],
      };
      setChatHistory((prevHistory) => [...prevHistory, networkErrorMessage]);
    } finally {
      setChatLoading(false);
    }
  }

  // Função para gerar dados aleatórios de exemplo
  function getRandomPerson(name: string) {
    const signs = [
      'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
      'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
    ];
    const planets = [
      'Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Plutão'
    ];
    const output = planets.map((planet) => ({
      planet: { en: planet },
      zodiac_sign: { name: { en: signs[Math.floor(Math.random() * signs.length)] } },
      normDegree: Math.random() * 30,
      isRetro: Math.random() > 0.8 ? 'true' : 'false',
    }));
    return {
      name,
      birthDate: `${String(Math.floor(Math.random()*28)+1).padStart(2,'0')}/0${Math.floor(Math.random()*9)+1}/19${Math.floor(Math.random()*90)+10}`,
      birthTime: `${String(Math.floor(Math.random()*24)).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
      birthPlace: 'Cidade Exemplo',
      output,
    };
  }

  function handleOpenRandomModal() {
    const p1 = getRandomPerson('Pessoa Aleatória 1');
    const p2 = getRandomPerson('Pessoa Aleatória 2');
    setPerson1({ name: p1.name, birthDate: p1.birthDate, birthTime: p1.birthTime, birthPlace: p1.birthPlace });
    setPerson2({ name: p2.name, birthDate: p2.birthDate, birthTime: p2.birthTime, birthPlace: p2.birthPlace });
    setResult1({ output: p1.output });
    setResult2({ output: p2.output });
    setShowModal(true);
    setStep(3);
    setChatHistory([]);
    setChatInput("");
  }

  return (
    <main className="min-h-screen flex flex-col relative bg-gradient-to-br from-[#f8fafc] to-[#e5e7eb] text-gray-800 font-sans overflow-hidden">
      <div className="w-full flex justify-end px-8 pt-6 z-30">
        <button
          onClick={handleOpenRandomModal}
          className="bg-gradient-to-r from-blue-500 to-sky-400 text-white font-bold px-6 py-2 rounded-lg shadow hover:from-blue-600 hover:to-sky-500 transition border border-blue-400"
        >
          Testar com dados aleatórios
        </button>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
      >
        <svg
          width="100%"
          height="100%"
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.22 }}
        >
          <defs>
            <pattern
              id="archi-grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="32" height="32" fill="none" />
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="#bfc7d1"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#archi-grid)" />
        </svg>
      </div>

      <section className="flex flex-1 flex-col md:flex-row items-center justify-center py-16 px-4 gap-24 w-[80vw] max-w-[1600px] mx-auto">
        <div className="flex-1 flex flex-col items-start justify-center text-left w-full md:max-w-lg pr-0 md:pr-12">
          <h1 className="pb-2 text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-slate-900">
            Sinastria
          </h1>

          <p className="max-w-xl text-base md:text-lg text-gray-500 mb-8 animate-fade-in delay-200">
            Descubra a compatibilidade astrológica entre duas pessoas de forma
            elegante e detalhada.
          </p>
        </div>
        <div
          id="form"
          className="flex-1 flex flex-col items-center justify-center w-full md:max-w-md animate-fade-in delay-700 md:pl-12"
        >
          <div className="bg-white bg-opacity-90 rounded-xl shadow-xl p-8 w-full flex flex-col items-center border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              {step === 1
                ? "Dados da Pessoa 1"
                : step === 2
                ? "Dados da Pessoa 2"
                : "Resultado da Sinastria"}
            </h2>
            <p className="mb-6 text-gray-500 text-center text-sm">
              {step === 1
                ? "Preencha os dados da primeira pessoa."
                : step === 2
                ? "Agora preencha os dados da segunda pessoa."
                : "Veja os mapas astrais gerados."}
            </p>
            {step < 3 && (
              <form
                onSubmit={handleNext}
                className="w-full flex flex-col gap-4"
              >
                <input
                  type="text"
                  placeholder="Nome"
                  value={step === 1 ? person1.name : person2.name}
                  onChange={(e) =>
                    step === 1
                      ? setPerson1({ ...person1, name: e.target.value })
                      : setPerson2({ ...person2, name: e.target.value })
                  }
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800 placeholder-gray-400 w-full"
                  required
                />
                <input
                  type="tel"
                  placeholder="Data de nascimento (dd/mm/aaaa)"
                  value={step === 1 ? person1.birthDate : person2.birthDate}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 8) v = v.slice(0, 8);
                    if (v.length > 4)
                      v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3");
                    else if (v.length > 2)
                      v = v.replace(/(\d{2})(\d{1,2})/, "$1/$2");
                    step === 1
                      ? setPerson1({ ...person1, birthDate: v })
                      : setPerson2({ ...person2, birthDate: v });
                  }}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800 placeholder-gray-400 w-full"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="off"
                />
                <input
                  type="tel"
                  placeholder="Hora de nascimento (hh:mm)"
                  value={step === 1 ? person1.birthTime : person2.birthTime}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 4) v = v.slice(0, 4);
                    if (v.length > 2)
                      v = v.replace(/(\d{2})(\d{1,2})/, "$1:$2");
                    const [hh, mm] = v.split(":");
                    let valid = true;
                    if (hh && parseInt(hh) > 23) valid = false;
                    if (mm && parseInt(mm) > 59) valid = false;
                    if (valid)
                      step === 1
                        ? setPerson1({ ...person1, birthTime: v })
                        : setPerson2({ ...person2, birthTime: v });
                  }}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800 placeholder-gray-400 w-full"
                  required
                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                  maxLength={5}
                  inputMode="numeric"
                  autoComplete="off"
                />
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Cidade de nascimento"
                    value={step === 1 ? person1.birthPlace : person2.birthPlace}
                    onChange={(e) => {
                      if (step === 1) {
                        setPerson1({ ...person1, birthPlace: e.target.value });
                        fetchCitySuggestions(e.target.value);
                      } else {
                        setPerson2({ ...person2, birthPlace: e.target.value });
                        fetchCitySuggestions(e.target.value);
                      }
                      setShowSuggestions(true);
                    }}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-800 placeholder-gray-400 w-full"
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
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-left text-sm text-gray-700"
                          onClick={() => {
                            if (step === 1)
                              setPerson1({
                                ...person1,
                                birthPlace: s.display_name,
                              });
                            else
                              setPerson2({
                                ...person2,
                                birthPlace: s.display_name,
                              });
                            setShowSuggestions(false);
                          }}
                        >
                          {s.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex w-full justify-between mt-4">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition border border-gray-300"
                    >
                      Voltar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="ml-auto bg-gradient-to-r from-gray-700 to-gray-400 text-white font-semibold py-2 px-6 rounded shadow hover:from-gray-800 hover:to-gray-500 transition border border-gray-300 tracking-wide text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          ></path>
                        </svg>
                        {step === 2 ? "Gerando..." : "Próximo"}
                      </span>
                    ) : (
                      <span>{step === 2 ? "Gerar Sinastria" : "Próximo"}</span>
                    )}
                  </button>
                </div>
              </form>
            )}
            {error && (
              <div className="mt-4 text-red-500 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>
      <SinastriaModal
        person1={person1}
        person2={person2}
        result1={result1}
        result2={result2}
        chatHistory={chatHistory}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        onChatSubmit={handleChatSubmit}
        show={showModal}
        onClose={() => setShowModal(false)}
      />
      <footer className="mt-8 text-gray-400 text-center py-6 animate-fade-in delay-1000 text-xs border-t border-gray-200">
        &copy; {new Date().getFullYear()} AstroGuide. Todos os direitos reservados.
      </footer>
    </main>
  );
}
