
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 가능합니다."
    });
  }

  const { grade, topic } = req.body || {};

  if (
    typeof grade !== "string" ||
    typeof topic !== "string" ||
    !grade.trim() ||
    !topic.trim()
  ) {
    return res.status(400).json({
      error: "학년과 수업 주제를 입력해 주세요."
    });
  }

  if (grade.length > 50 || topic.length > 200) {
    return res.status(400).json({
      error: "입력 내용이 너무 깁니다."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "AI API 키가 설정되지 않았습니다."
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "당신은 초등학교 교사를 돕는 AI 교육 전문가입니다. " +
                "학생의 발달 수준에 적합하고 안전한 학습활동 " +
                "3가지를 한국어로 추천하세요. " +
                "구성주의와 컴퓨팅 사고력을 고려하고, " +
                "각 활동의 방법과 교육적 효과를 간단히 설명하세요."
            },
            {
              role: "user",
              content:
                `대상 학년: ${grade}\n수업 주제: ${topic}`
            }
          ],
          max_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OpenAI API 오류:",
        response.status
      );

      return res.status(502).json({
        error: "AI 응답을 가져오지 못했습니다."
      });
    }

    const recommendation =
      data.choices?.[0]?.message?.content;

    if (!recommendation) {
      return res.status(502).json({
        error: "추천 결과가 비어 있습니다."
      });
    }

    return res.status(200).json({
      recommendation
    });

  } catch (error) {
    console.error("AI 연결 오류:", error);

    return res.status(500).json({
      error: "AI 연결 중 오류가 발생했습니다."
    });
  }
}
