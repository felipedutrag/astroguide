import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { birthDate, birthTime, lat, lon } = await req.json();

    let timezone = -3;

    if (!lat || !lon || timezone === undefined) {
      return NextResponse.json(
        { error: "Dados de localização incompletos." },
        { status: 400 }
      );
    }

    // Parse data/hora
    const [year, month, date] = birthDate.split("-").map(Number);
    const [hours, minutes] = birthTime.split(":").map(Number);
    const seconds = 0;

    // Monta o body conforme a documentação da API
    const body = {
      year,
      month,
      date,
      hours,
      minutes,
      seconds,
      latitude: lat,
      longitude: lon,
      timezone,
      config: {
        observation_point: "topocentric",
        ayanamsha: "tropical",
        language: "pt",
      },
    };

    console.log("[API REQUEST] Dados enviados para FreeAstrologyAPI:", body);

    const response = await fetch(
      "https://json.freeastrologyapi.com/western/planets",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": `ZvslQz7r2t486qZVBAGT39iLVeF6tvE31HNF7yaj`,
        },
        body: JSON.stringify(body),
      }
    );

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("[API ERROR] Erro ao fazer parse do JSON de resposta:", e);
      data = null;
    }

    console.log("[API RESPONSE] Resposta da FreeAstrologyAPI:", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao consultar API de astrologia.", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
