
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 가능합니다."
    });
  }

  const { grade, topic } = req.body || {};

  const grades = [
    "초등학교 1학년",
    "초등학교 2학년",
    "초등학교 3학년",
    "초등학교 4학년",
    "초등학교 5학년",
    "초등학교 6학년"
  ];

  if (
    !grades.includes(grade) ||
    typeof topic !== "string" ||
    !topic.trim() ||
    topic.length > 100
  ) {
    return res.status(400).json({
      error: "학년과 수업 주제를 확인해 주세요."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Gemini API 키가 설정되지 않았습니다."
    });
  }

  const prompt = `
당신은 초등학교 수업을 지원하는 교육 전문가입니다.

대상: ${grade}
수업 주제: ${topic}

다음 조건에 맞춰 한국어로 학습활동 3가지를 추천하세요.

1. 초등학생의 발달 수준에 적합할 것
2. 구성주의 학습 원리를 반영할 것
3. 컴퓨팅 사고력 활동을 포함할 것
4. 각 활동의 방법과 교육적 효과를 설명할 것
5. 학생에게 안전하고 실행하기 쉬울 것

제목과 번호를 사용하여 읽기 쉽게 작성하세요.
`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!response.ok) {
      console.error("Gemini API 오류:", response.status);

      if (response.status === 429) {
        return res.status(429).json({
          error: "무료 사용 한도에 도달했습니다. 나중에 다시 시도해 주세요."
        });
      }

      return res.status(502).json({
        error: "AI 추천을 가져오지 못했습니다."
      });
    }

    const data = await response.json();

    const recommendation = (
      data.candidates?.[0]?.content?.parts || []
    )
      .map(part => part.text || "")
      .join("\n")
      .trim();

    if (!recommendation) {
      return res.status(502).json({
        error: "추천 결과가 비어 있습니다."
      });
    }

    return res.status(200).json({
      recommendation
    });

  } catch (error) {
    console.error("Gemini 연결 오류:", error);

    return res.status(500).json({
      error: "AI 연결 중 오류가 발생했습니다."
    });
  }
}
