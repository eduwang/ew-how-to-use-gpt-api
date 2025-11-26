import './style.css'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import Handsontable from 'handsontable'
import 'handsontable/dist/handsontable.full.css'

let apiKey = '';
let isApiKeyValid = false;

// 챗봇 설정
let chatConfig = {
  model: 'gpt-3.5-turbo',
  systemPrompt: '당신은 친절하고 도움이 되는 AI 어시스턴트입니다. 사용자의 질문에 정확하고 상세하게 답변해주세요.',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1.0
};

// 피드백 설정
let feedbackConfig = {
  model: 'gpt-3.5-turbo',
  systemPrompt: `당신은 글쓰기 전문가입니다. 학생의 글을 다음 루브릭을 기준으로 평가하고 피드백을 제공해주세요.

**논리적 흐름 평가 루브릭:**

1. **주제의 명확성 (20점)**
   - 주제가 명확하게 제시되었는가?
   - 주제가 일관되게 유지되는가?

2. **구조의 체계성 (25점)**
   - 서론, 본론, 결론이 적절히 구성되었는가?
   - 각 단락이 논리적으로 연결되어 있는가?

3. **논리적 전개 (30점)**
   - 주장이 근거와 함께 제시되었는가?
   - 논리적 오류가 없는가?
   - 인과관계가 명확한가?

4. **문장의 일관성 (15점)**
   - 문장 간 연결이 자연스러운가?
   - 전환 표현이 적절한가?

5. **전체적 완성도 (10점)**
   - 글의 목적이 달성되었는가?
   - 독자에게 전달하고자 하는 메시지가 명확한가?

**피드백 제공 방식:**
- 각 항목별로 점수를 매기고 구체적인 피드백을 제공하세요.
- 개선이 필요한 부분을 구체적으로 지적하고 개선 방안을 제시하세요.
- 긍정적인 부분도 함께 언급하여 격려해주세요.
- 전체적인 종합 평가를 마지막에 제공하세요.`,
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1.0
};

// 채팅 메시지 저장
let chatMessages = [];

// PDF 요약 설정
let pdfSummaryConfig = {
  model: 'gpt-3.5-turbo'
};

// 표 데이터 설명 설정
let tableConfig = {
  model: 'gpt-3.5-turbo',
  systemPrompt: '당신은 데이터 분석 전문가입니다. 제공된 표 데이터를 분석하고 해석하여 명확하고 유용한 설명을 제공해주세요. 데이터의 패턴, 추세, 특징, 그리고 의미 있는 인사이트를 포함하여 설명해주세요.',
  temperature: 0.7,
  maxTokens: 4000,
  topP: 1.0
};

// Handsontable 인스턴스
let hotInstance = null;

// 퀴즈 생성 설정
let quizConfig = {
  model: 'gpt-3.5-turbo',
  systemPrompt: `
  당신은 교육 전문가입니다.
  제공된 텍스트 또는 문서를 바탕으로 학습에 도움이 되는 다양한 유형의 퀴즈를 생성해주세요.
  각 문항에는 문제, 정답, 정답에 대한 상세한 해설을 반드시 포함해주세요.
  
  퀴즈는 다음 기준을 충족해야 합니다.
  1. 객관식, 단답형, 서술형 등 문항 유형을 다양하게 구성할 것
  2. 제공된 텍스트의 핵심 개념과 세부 내용을 균형 있게 반영할 것
  3. 학습자가 내용을 이해했는지 확인할 수 있는 수준의 적절한 난이도로 만들 것
  4. 문항 수는 5개 내외로 구성 (필요 시 조정 가능)
  
  출력 형식은 다음과 같습니다:
  Q1. (문항 유형 표시) 문제 내용
  정답:
  해설:
  이 형식을 모든 문항에서 동일하게 유지해주세요.
  `,
  temperature: 0.7,
  maxTokens: 2000,
  topP: 1.0
};

// API Key 검증 함수
async function validateApiKey(key) {
  if (!key || key.trim() === '') {
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// API Key 입력 및 검증 UI
function renderApiKeySection() {
  const apiKeySection = document.querySelector('.api-key-section');
  const statusIndicator = apiKeySection.querySelector('.api-key-status');
  const input = apiKeySection.querySelector('#api-key-input');
  const saveBtn = apiKeySection.querySelector('#save-api-key');
  const changeBtn = apiKeySection.querySelector('#change-api-key');

  // 저장 버튼 클릭 이벤트
  saveBtn.addEventListener('click', async () => {
    const key = input.value.trim();
    if (!key) {
      statusIndicator.textContent = 'API Key를 입력해주세요.';
      statusIndicator.className = 'api-key-status error';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = '검증 중...';
    statusIndicator.textContent = '검증 중...';
    statusIndicator.className = 'api-key-status checking';

    const isValid = await validateApiKey(key);
    
    if (isValid) {
      apiKey = key;
      isApiKeyValid = true;
      statusIndicator.textContent = '✓ API Key가 정상적으로 설정되었습니다.';
      statusIndicator.className = 'api-key-status valid';
      localStorage.setItem('openai_api_key', key);
      input.disabled = true;
      saveBtn.style.display = 'none';
      changeBtn.style.display = 'block';
    } else {
      isApiKeyValid = false;
      statusIndicator.textContent = '✗ API Key가 유효하지 않습니다. 다시 확인해주세요.';
      statusIndicator.className = 'api-key-status error';
      saveBtn.textContent = '저장';
    }

    saveBtn.disabled = false;
  });

  // 변경 버튼 클릭 이벤트
  changeBtn.addEventListener('click', () => {
    input.disabled = false;
    input.focus();
    input.select();
    saveBtn.style.display = 'block';
    changeBtn.style.display = 'none';
    saveBtn.textContent = '저장';
    statusIndicator.textContent = 'API Key를 수정하고 저장 버튼을 눌러주세요.';
    statusIndicator.className = 'api-key-status';
  });

  // 저장된 API Key 불러오기
  const savedKey = localStorage.getItem('openai_api_key');
  if (savedKey) {
    input.value = savedKey;
    saveBtn.click();
  }
}

// 탭 전환 함수
function switchTab(tabName) {
  // 모든 탭 버튼과 콘텐츠 비활성화
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // 선택된 탭 활성화
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.querySelector(`#${tabName}-content`).classList.add('active');
}

// 초기 렌더링
document.querySelector('#app').innerHTML = `
  <div class="container">
    <header>
      <h1>ChatGPT API 활용 가이드</h1>
      <p class="subtitle">다양한 기능을 통해 ChatGPT API의 활용 방법을 탐색해 보세요</p>
      <div class="disclaimer">
        <strong>⚠️ 주의사항:</strong>아래 내용은 예시 제공을 목적으로 구성된 것으로, 학술적으로 검증된 내용이 아님을 안내드립니다.
    </header>

    <div class="api-key-section">
      <div class="api-key-header">
        <label for="api-key-input">OpenAI API Key</label>
        <div class="api-key-input-group">
          <input 
            type="password" 
            id="api-key-input" 
            placeholder="sk-..." 
            class="api-key-input"
          />
          <button id="save-api-key" class="save-btn">저장</button>
          <button id="change-api-key" class="change-btn" style="display: none;">변경</button>
    </div>
        <div class="api-key-status">API Key를 입력하고 저장 버튼을 눌러주세요.</div>
      </div>
    </div>

    <div class="tabs-container">
      <div class="tabs">
        <button class="tab-button active" data-tab="chatbot">Chatbot</button>
        <button class="tab-button" data-tab="feedback">루브릭 기반 글 피드백</button>
        <button class="tab-button" data-tab="pdf-summary">PDF 파일 요약기</button>
        <button class="tab-button" data-tab="quiz">퀴즈 생성</button>
        <button class="tab-button" data-tab="table">표 데이터 설명</button>
      </div>

      <div class="tab-contents">
        <div id="chatbot-content" class="tab-content active">
          <div class="chatbot-header">
            <h2>기본적인 Chatbot</h2>
            <button id="api-settings-btn" class="settings-btn">API 설정</button>
          </div>
          <div class="chatbot-container">
            <div id="chat-messages" class="chat-messages"></div>
            <div class="chat-input-container">
              <textarea 
                id="chat-input" 
                class="chat-input" 
                placeholder="메시지를 입력하세요..."
                rows="1"
              ></textarea>
              <button id="send-btn" class="send-btn">전송</button>
            </div>
          </div>
        </div>

        <div id="feedback-content" class="tab-content">
          <div class="feedback-header">
            <h2>루브릭 기반 글 피드백</h2>
            <div class="feedback-header-buttons">
              <button id="load-example-btn" class="example-btn">예시 글 불러오기</button>
              <button id="feedback-settings-btn" class="settings-btn">API 설정</button>
            </div>
          </div>
          <div class="feedback-container">
            <div class="feedback-input-section">
              <label for="feedback-text-input" class="section-label">글 입력</label>
              <textarea 
                id="feedback-text-input" 
                class="feedback-text-input" 
                placeholder="피드백을 받을 글을 입력하거나 붙여넣어주세요..."
              ></textarea>
              <button id="generate-feedback-btn" class="generate-btn">피드백 생성</button>
            </div>
            <div class="feedback-output-section">
              <label class="section-label">피드백 결과</label>
              <div id="feedback-output" class="feedback-output">
                <p class="placeholder-text">왼쪽에 글을 입력하고 '피드백 생성' 버튼을 클릭하세요.</p>
              </div>
            </div>
          </div>
        </div>

        <div id="pdf-summary-content" class="tab-content">
          <div class="pdf-summary-header">
            <h2>PDF 파일 요약기</h2>
            <button id="pdf-summary-settings-btn" class="settings-btn">API 설정</button>
          </div>
          <div class="pdf-summary-container">
            <div class="pdf-upload-section">
              <label for="pdf-file-input" class="section-label">PDF 파일 업로드</label>
              <div class="file-upload-area" id="file-upload-area">
                <input 
                  type="file" 
                  id="pdf-file-input" 
                  class="file-input" 
                  accept=".pdf"
                />
                <div class="file-upload-content">
                  <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p class="upload-text">PDF 파일을 드래그하거나 클릭하여 업로드</p>
                  <p class="upload-hint">또는 파일 선택</p>
                </div>
              </div>
              <div id="pdf-file-info" class="file-info" style="display: none;">
                <span id="pdf-file-name"></span>
                <button id="remove-pdf-btn" class="remove-file-btn">×</button>
              </div>
              <button id="summarize-pdf-btn" class="generate-btn" style="display: none; margin-top: 1rem;">요약 생성</button>
            </div>
            <div class="pdf-summary-section">
              <label class="section-label">요약 결과</label>
              <div id="pdf-summary-output" class="pdf-summary-output">
                <p class="placeholder-text">PDF 파일을 업로드하고 '요약 생성' 버튼을 클릭하세요.</p>
              </div>
            </div>
          </div>
        </div>

        <div id="quiz-content" class="tab-content">
          <div class="quiz-header">
            <h2>텍스트 또는 PDF 파일로부터 퀴즈 생성</h2>
            <div class="quiz-header-buttons">
              <button id="load-quiz-example-btn" class="example-btn">예시 글 불러오기</button>
              <button id="quiz-settings-btn" class="settings-btn">API 설정</button>
            </div>
          </div>
          <div class="quiz-container">
            <div class="quiz-input-section">
              <div class="input-tabs">
                <button class="input-tab active" data-input-type="text">텍스트 입력</button>
                <button class="input-tab" data-input-type="pdf">PDF 업로드</button>
              </div>
              
              <div id="text-input-panel" class="input-panel active">
                <label for="quiz-text-input" class="section-label">텍스트 입력</label>
                <textarea 
                  id="quiz-text-input" 
                  class="quiz-text-input" 
                  placeholder="퀴즈를 생성할 텍스트를 입력하거나 붙여넣어주세요..."
                ></textarea>
              </div>
              
              <div id="pdf-input-panel" class="input-panel">
                <label class="section-label">PDF 파일 업로드</label>
                <div class="file-upload-area" id="quiz-file-upload-area">
                  <input 
                    type="file" 
                    id="quiz-pdf-file-input" 
                    class="file-input" 
                    accept=".pdf"
                  />
                  <div class="file-upload-content">
                    <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <p class="upload-text">PDF 파일을 드래그하거나 클릭하여 업로드</p>
                    <p class="upload-hint">또는 파일 선택</p>
                  </div>
                </div>
                <div id="quiz-pdf-file-info" class="file-info" style="display: none;">
                  <span id="quiz-pdf-file-name"></span>
                  <button id="remove-quiz-pdf-btn" class="remove-file-btn">×</button>
                </div>
              </div>
              
              <button id="generate-quiz-btn" class="generate-btn" style="margin-top: 1rem;">퀴즈 생성</button>
            </div>
            <div class="quiz-output-section">
              <label class="section-label">생성된 퀴즈</label>
              <div id="quiz-output" class="quiz-output">
                <p class="placeholder-text">텍스트를 입력하거나 PDF 파일을 업로드하고 '퀴즈 생성' 버튼을 클릭하세요.</p>
              </div>
            </div>
          </div>
        </div>

        <div id="table-content" class="tab-content">
          <div class="table-header">
            <h2>표 데이터 입력 후 설명</h2>
            <div class="table-header-buttons">
              <button id="load-table-example-btn" class="example-btn">예시 데이터 불러오기</button>
              <button id="table-settings-btn" class="settings-btn">API 설정</button>
            </div>
          </div>
          <div class="table-container">
            <div class="table-input-section">
              <label class="section-label">표 데이터 입력</label>
              <div id="table-editor" class="table-editor"></div>
              <div class="table-actions">
                <button id="generate-table-analysis-btn" class="generate-btn">자료 해석 생성</button>
              </div>
            </div>
            <div class="table-output-section">
              <label class="section-label">자료 해석 결과</label>
              <div id="table-analysis-output" class="table-analysis-output">
                <p class="placeholder-text">표 데이터를 입력하고 '자료 해석 생성' 버튼을 클릭하세요.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 챗봇 API 설정 모달 -->
    <div id="api-settings-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>API 설정</h3>
          <button class="modal-close" id="close-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="setting-item">
            <label for="model-select" class="setting-label">
              Model
              <span class="tooltip-icon" data-tooltip="사용할 GPT 모델을 선택합니다. GPT-4는 더 정확하지만 비용이 높고, GPT-3.5는 빠르고 경제적입니다.">ℹ️</span>
            </label>
            <select id="model-select" class="setting-input">
              <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-5-mini">GPT-5 mini</option>
              <option value="gpt-5.1">GPT-5.1</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="system-prompt" class="setting-label">
              System Prompt
              <span class="tooltip-icon" data-tooltip="AI의 역할과 행동 방식을 정의하는 시스템 프롬프트입니다. 챗봇의 성격과 응답 스타일을 결정합니다.">ℹ️</span>
            </label>
            <textarea 
              id="system-prompt" 
              class="setting-input setting-textarea" 
              rows="4"
              placeholder="시스템 프롬프트를 입력하세요..."
            ></textarea>
          </div>

          <div class="setting-item">
            <label for="temperature" class="setting-label">
              Temperature
              <span class="tooltip-icon" data-tooltip="응답의 창의성을 조절합니다. 낮을수록 일관되고 예측 가능하며, 높을수록 다양하고 창의적인 응답을 생성합니다. (0.0 ~ 2.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="temperature" 
                class="setting-slider" 
                min="0" 
                max="2" 
                step="0.1" 
                value="0.7"
              />
              <span id="temperature-value" class="slider-value">0.7</span>
            </div>
          </div>

          <div class="setting-item">
            <label for="max-tokens" class="setting-label">
              Max Tokens
              <span class="tooltip-icon" data-tooltip="응답의 최대 길이를 제한합니다. 토큰은 단어의 일부로, 대략 1토큰 = 0.75단어입니다. 값이 클수록 더 긴 응답을 받을 수 있습니다.">ℹ️</span>
            </label>
            <input 
              type="number" 
              id="max-tokens" 
              class="setting-input" 
              min="1" 
              max="4096" 
              value="1000"
            />
          </div>

          <div class="setting-item">
            <label for="top-p" class="setting-label">
              Top P
              <span class="tooltip-icon" data-tooltip="Nucleus 샘플링 파라미터입니다. 확률 질량의 누적 합이 이 값을 초과하는 토큰만 고려합니다. Temperature와 함께 사용하여 응답의 다양성을 조절합니다. (0.0 ~ 1.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="top-p" 
                class="setting-slider" 
                min="0" 
                max="1" 
                step="0.1" 
                value="1.0"
              />
              <span id="top-p-value" class="slider-value">1.0</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="save-settings" class="save-settings-btn">저장</button>
          <button id="cancel-settings" class="cancel-settings-btn">취소</button>
        </div>
      </div>
    </div>

    <!-- 피드백 API 설정 모달 -->
    <div id="feedback-settings-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>API 설정 (피드백)</h3>
          <button class="modal-close" id="close-feedback-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="setting-item">
            <label for="feedback-model-select" class="setting-label">
              Model
              <span class="tooltip-icon" data-tooltip="사용할 GPT 모델을 선택합니다. GPT-4는 더 정확하지만 비용이 높고, GPT-3.5는 빠르고 경제적입니다.">ℹ️</span>
            </label>
            <select id="feedback-model-select" class="setting-input">
              <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-5-mini">GPT-5 mini</option>
              <option value="gpt-5.1">GPT-5.1</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="feedback-system-prompt" class="setting-label">
              System Prompt
              <span class="tooltip-icon" data-tooltip="AI의 역할과 행동 방식을 정의하는 시스템 프롬프트입니다. 루브릭 기반 피드백을 제공하는 역할을 정의합니다.">ℹ️</span>
            </label>
            <textarea 
              id="feedback-system-prompt" 
              class="setting-input setting-textarea" 
              rows="8"
              placeholder="시스템 프롬프트를 입력하세요..."
            ></textarea>
          </div>

          <div class="setting-item">
            <label for="feedback-temperature" class="setting-label">
              Temperature
              <span class="tooltip-icon" data-tooltip="응답의 창의성을 조절합니다. 낮을수록 일관되고 예측 가능하며, 높을수록 다양하고 창의적인 응답을 생성합니다. (0.0 ~ 2.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="feedback-temperature" 
                class="setting-slider" 
                min="0" 
                max="2" 
                step="0.1" 
                value="0.7"
              />
              <span id="feedback-temperature-value" class="slider-value">0.7</span>
            </div>
          </div>

          <div class="setting-item">
            <label for="feedback-max-tokens" class="setting-label">
              Max Tokens
              <span class="tooltip-icon" data-tooltip="응답의 최대 길이를 제한합니다. 토큰은 단어의 일부로, 대략 1토큰 = 0.75단어입니다. 값이 클수록 더 긴 응답을 받을 수 있습니다.">ℹ️</span>
            </label>
            <input 
              type="number" 
              id="feedback-max-tokens" 
              class="setting-input" 
              min="1" 
              max="4096" 
              value="2000"
            />
          </div>

          <div class="setting-item">
            <label for="feedback-top-p" class="setting-label">
              Top P
              <span class="tooltip-icon" data-tooltip="Nucleus 샘플링 파라미터입니다. 확률 질량의 누적 합이 이 값을 초과하는 토큰만 고려합니다. Temperature와 함께 사용하여 응답의 다양성을 조절합니다. (0.0 ~ 1.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="feedback-top-p" 
                class="setting-slider" 
                min="0" 
                max="1" 
                step="0.1" 
                value="1.0"
              />
              <span id="feedback-top-p-value" class="slider-value">1.0</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="save-feedback-settings" class="save-settings-btn">저장</button>
          <button id="cancel-feedback-settings" class="cancel-settings-btn">취소</button>
        </div>
      </div>
    </div>

    <!-- PDF 요약기 API 설정 모달 -->
    <div id="pdf-summary-settings-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>API 설정 (PDF 요약)</h3>
          <button class="modal-close" id="close-pdf-summary-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="setting-item">
            <label for="pdf-summary-model-select" class="setting-label">
              Model
              <span class="tooltip-icon" data-tooltip="사용할 GPT 모델을 선택합니다. GPT-4는 더 정확하지만 비용이 높고, GPT-3.5는 빠르고 경제적입니다.">ℹ️</span>
            </label>
            <select id="pdf-summary-model-select" class="setting-input">
              <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-5-mini">GPT-5 mini</option>
              <option value="gpt-5.1">GPT-5.1</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button id="save-pdf-summary-settings" class="save-settings-btn">저장</button>
          <button id="cancel-pdf-summary-settings" class="cancel-settings-btn">취소</button>
        </div>
      </div>
    </div>

    <!-- 퀴즈 생성기 API 설정 모달 -->
    <div id="quiz-settings-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>API 설정 (퀴즈 생성)</h3>
          <button class="modal-close" id="close-quiz-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="setting-item">
            <label for="quiz-model-select" class="setting-label">
              Model
              <span class="tooltip-icon" data-tooltip="사용할 GPT 모델을 선택합니다. GPT-4는 더 정확하지만 비용이 높고, GPT-3.5는 빠르고 경제적입니다.">ℹ️</span>
            </label>
            <select id="quiz-model-select" class="setting-input">
              <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-5-mini">GPT-5 mini</option>
              <option value="gpt-5.1">GPT-5.1</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="quiz-system-prompt" class="setting-label">
              System Prompt
              <span class="tooltip-icon" data-tooltip="AI의 역할과 행동 방식을 정의하는 시스템 프롬프트입니다. 퀴즈 생성의 성격과 스타일을 결정합니다.">ℹ️</span>
            </label>
            <textarea 
              id="quiz-system-prompt" 
              class="setting-input setting-textarea" 
              rows="6"
              placeholder="시스템 프롬프트를 입력하세요..."
            ></textarea>
          </div>

          <div class="setting-item">
            <label for="quiz-temperature" class="setting-label">
              Temperature
              <span class="tooltip-icon" data-tooltip="응답의 창의성을 조절합니다. 낮을수록 일관되고 예측 가능하며, 높을수록 다양하고 창의적인 응답을 생성합니다. (0.0 ~ 2.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="quiz-temperature" 
                class="setting-slider" 
                min="0" 
                max="2" 
                step="0.1" 
                value="0.7"
              />
              <span id="quiz-temperature-value" class="slider-value">0.7</span>
            </div>
          </div>

          <div class="setting-item">
            <label for="quiz-max-tokens" class="setting-label">
              Max Tokens
              <span class="tooltip-icon" data-tooltip="응답의 최대 길이를 제한합니다. 토큰은 단어의 일부로, 대략 1토큰 = 0.75단어입니다. 값이 클수록 더 긴 응답을 받을 수 있습니다.">ℹ️</span>
            </label>
            <input 
              type="number" 
              id="quiz-max-tokens" 
              class="setting-input" 
              min="1" 
              max="4096" 
              value="2000"
            />
          </div>

          <div class="setting-item">
            <label for="quiz-top-p" class="setting-label">
              Top P
              <span class="tooltip-icon" data-tooltip="Nucleus 샘플링 파라미터입니다. 확률 질량의 누적 합이 이 값을 초과하는 토큰만 고려합니다. Temperature와 함께 사용하여 응답의 다양성을 조절합니다. (0.0 ~ 1.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="quiz-top-p" 
                class="setting-slider" 
                min="0" 
                max="1" 
                step="0.1" 
                value="1.0"
              />
              <span id="quiz-top-p-value" class="slider-value">1.0</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="save-quiz-settings" class="save-settings-btn">저장</button>
          <button id="cancel-quiz-settings" class="cancel-settings-btn">취소</button>
        </div>
      </div>
    </div>

    <!-- 표 데이터 설명 API 설정 모달 -->
    <div id="table-settings-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>API 설정 (표 데이터 설명)</h3>
          <button class="modal-close" id="close-table-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="setting-item">
            <label for="table-model-select" class="setting-label">
              Model
              <span class="tooltip-icon" data-tooltip="사용할 GPT 모델을 선택합니다. GPT-4는 더 정확하지만 비용이 높고, GPT-3.5는 빠르고 경제적입니다.">ℹ️</span>
            </label>
            <select id="table-model-select" class="setting-input">
              <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-5-mini">GPT-5 mini</option>
              <option value="gpt-5.1">GPT-5.1</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="table-system-prompt" class="setting-label">
              System Prompt
              <span class="tooltip-icon" data-tooltip="AI의 역할과 행동 방식을 정의하는 시스템 프롬프트입니다. 데이터 해석의 성격과 스타일을 결정합니다.">ℹ️</span>
            </label>
            <textarea 
              id="table-system-prompt" 
              class="setting-input setting-textarea" 
              rows="6"
              placeholder="시스템 프롬프트를 입력하세요..."
            ></textarea>
          </div>

          <div class="setting-item">
            <label for="table-temperature" class="setting-label">
              Temperature
              <span class="tooltip-icon" data-tooltip="응답의 창의성을 조절합니다. 낮을수록 일관되고 예측 가능하며, 높을수록 다양하고 창의적인 응답을 생성합니다. (0.0 ~ 2.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="table-temperature" 
                class="setting-slider" 
                min="0" 
                max="2" 
                step="0.1" 
                value="0.7"
              />
              <span id="table-temperature-value" class="slider-value">0.7</span>
            </div>
          </div>

          <div class="setting-item">
            <label for="table-max-tokens" class="setting-label">
              Max Tokens
              <span class="tooltip-icon" data-tooltip="응답의 최대 길이를 제한합니다. 토큰은 단어의 일부로, 대략 1토큰 = 0.75단어입니다. 값이 클수록 더 긴 응답을 받을 수 있습니다.">ℹ️</span>
            </label>
            <input 
              type="number" 
              id="table-max-tokens" 
              class="setting-input" 
              min="1" 
              max="4096" 
              value="2000"
            />
          </div>

          <div class="setting-item">
            <label for="table-top-p" class="setting-label">
              Top P
              <span class="tooltip-icon" data-tooltip="Nucleus 샘플링 파라미터입니다. 확률 질량의 누적 합이 이 값을 초과하는 토큰만 고려합니다. Temperature와 함께 사용하여 응답의 다양성을 조절합니다. (0.0 ~ 1.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="table-top-p" 
                class="setting-slider" 
                min="0" 
                max="1" 
                step="0.1" 
                value="1.0"
              />
              <span id="table-top-p-value" class="slider-value">1.0</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="save-table-settings" class="save-settings-btn">저장</button>
          <button id="cancel-table-settings" class="cancel-settings-btn">취소</button>
        </div>
      </div>
    </div>

    <!-- 표 데이터 설명 API 설정 모달 -->
    <div id="table-settings-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>API 설정 (표 데이터 설명)</h3>
          <button class="modal-close" id="close-table-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="setting-item">
            <label for="table-model-select" class="setting-label">
              Model
              <span class="tooltip-icon" data-tooltip="사용할 GPT 모델을 선택합니다. GPT-4는 더 정확하지만 비용이 높고, GPT-3.5는 빠르고 경제적입니다.">ℹ️</span>
            </label>
            <select id="table-model-select" class="setting-input">
              <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-5-mini">GPT-5 mini</option>
              <option value="gpt-5.1">GPT-5.1</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="table-system-prompt" class="setting-label">
              System Prompt
              <span class="tooltip-icon" data-tooltip="AI의 역할과 행동 방식을 정의하는 시스템 프롬프트입니다. 데이터 해석의 성격과 스타일을 결정합니다.">ℹ️</span>
            </label>
            <textarea 
              id="table-system-prompt" 
              class="setting-input setting-textarea" 
              rows="6"
              placeholder="시스템 프롬프트를 입력하세요..."
            ></textarea>
          </div>

          <div class="setting-item">
            <label for="table-temperature" class="setting-label">
              Temperature
              <span class="tooltip-icon" data-tooltip="응답의 창의성을 조절합니다. 낮을수록 일관되고 예측 가능하며, 높을수록 다양하고 창의적인 응답을 생성합니다. (0.0 ~ 2.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="table-temperature" 
                class="setting-slider" 
                min="0" 
                max="2" 
                step="0.1" 
                value="0.7"
              />
              <span id="table-temperature-value" class="slider-value">0.7</span>
            </div>
          </div>

          <div class="setting-item">
            <label for="table-max-tokens" class="setting-label">
              Max Tokens
              <span class="tooltip-icon" data-tooltip="응답의 최대 길이를 제한합니다. 토큰은 단어의 일부로, 대략 1토큰 = 0.75단어입니다. 값이 클수록 더 긴 응답을 받을 수 있습니다.">ℹ️</span>
            </label>
            <input 
              type="number" 
              id="table-max-tokens" 
              class="setting-input" 
              min="1" 
              max="4096" 
              value="2000"
            />
          </div>

          <div class="setting-item">
            <label for="table-top-p" class="setting-label">
              Top P
              <span class="tooltip-icon" data-tooltip="Nucleus 샘플링 파라미터입니다. 확률 질량의 누적 합이 이 값을 초과하는 토큰만 고려합니다. Temperature와 함께 사용하여 응답의 다양성을 조절합니다. (0.0 ~ 1.0)">ℹ️</span>
            </label>
            <div class="slider-container">
              <input 
                type="range" 
                id="table-top-p" 
                class="setting-slider" 
                min="0" 
                max="1" 
                step="0.1" 
                value="1.0"
              />
              <span id="table-top-p-value" class="slider-value">1.0</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="save-table-settings" class="save-settings-btn">저장</button>
          <button id="cancel-table-settings" class="cancel-settings-btn">취소</button>
        </div>
      </div>
    </div>

    <footer>
      <p>Made by Hyowon Wang</p>
    </footer>
  </div>
`

// 이벤트 리스너 설정
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const tabName = button.getAttribute('data-tab');
    switchTab(tabName);
  });
});

// API Key 섹션 초기화
renderApiKeySection();

// 챗봇 기능 초기화
function initChatbot() {
  // 저장된 설정 불러오기
  const savedConfig = localStorage.getItem('chatbot_config');
  if (savedConfig) {
    chatConfig = { ...chatConfig, ...JSON.parse(savedConfig) };
  }

  // 모달 열기/닫기
  const modal = document.getElementById('api-settings-modal');
  const settingsBtn = document.getElementById('api-settings-btn');
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-settings');

  settingsBtn.addEventListener('click', () => {
    openSettingsModal();
  });

  closeBtn.addEventListener('click', closeSettingsModal);
  cancelBtn.addEventListener('click', closeSettingsModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettingsModal();
    }
  });

  // 설정 저장
  const saveBtn = document.getElementById('save-settings');
  saveBtn.addEventListener('click', saveSettings);

  // 슬라이더 값 표시
  const temperatureSlider = document.getElementById('temperature');
  const topPSlider = document.getElementById('top-p');
  const temperatureValue = document.getElementById('temperature-value');
  const topPValue = document.getElementById('top-p-value');

  temperatureSlider.addEventListener('input', (e) => {
    temperatureValue.textContent = e.target.value;
  });

  topPSlider.addEventListener('input', (e) => {
    topPValue.textContent = e.target.value;
  });

  // 채팅 입력 처리
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 텍스트 영역 자동 높이 조절
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
  });

  // Tooltip 위치 동적 계산
  setupTooltips();
}

// Tooltip 위치 설정
function setupTooltips() {
  const tooltipIcons = document.querySelectorAll('.tooltip-icon');
  
  tooltipIcons.forEach(icon => {
    // 기존 ::after 스타일을 무시하고 JavaScript로 제어
    icon.addEventListener('mouseenter', (e) => {
      showTooltip(icon, e);
    });
    
    icon.addEventListener('mouseleave', () => {
      hideTooltip(icon);
    });
  });
}

// Tooltip 표시
function showTooltip(icon, event) {
  // 기존 tooltip 제거
  hideTooltip(icon);
  
  const tooltipText = icon.getAttribute('data-tooltip');
  if (!tooltipText) return;
  
  // Tooltip 요소 생성
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip-dynamic';
  tooltip.textContent = tooltipText;
  document.body.appendChild(tooltip);
  
  // 위치 계산
  const iconRect = icon.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // 기본 위치: 아이콘 위쪽 중앙
  let top = iconRect.top - tooltipRect.height - 8;
  let left = iconRect.left + (iconRect.width / 2) - (tooltipRect.width / 2);
  
  // 화면 경계 체크 및 조정
  const padding = 10;
  
  // 왼쪽 경계
  if (left < padding) {
    left = padding;
  }
  
  // 오른쪽 경계
  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }
  
  // 위쪽 경계 - 아래쪽에 표시
  if (top < padding) {
    top = iconRect.bottom + 8;
  }
  
  // 아래쪽 경계
  if (top + tooltipRect.height > window.innerHeight - padding) {
    top = iconRect.top - tooltipRect.height - 8;
    // 그래도 안 되면 위쪽에 최대한 가깝게
    if (top < padding) {
      top = padding;
    }
  }
  
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  tooltip.style.display = 'block';
  
  // 아이콘에 tooltip 참조 저장
  icon._tooltipElement = tooltip;
  
  // 약간의 지연 후 fade-in 효과
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.style.opacity = '1';
    }
  }, 10);
}

// Tooltip 숨기기
function hideTooltip(icon) {
  if (icon._tooltipElement) {
    icon._tooltipElement.style.opacity = '0';
    setTimeout(() => {
      if (icon._tooltipElement && icon._tooltipElement.parentNode) {
        icon._tooltipElement.parentNode.removeChild(icon._tooltipElement);
      }
      icon._tooltipElement = null;
    }, 200);
  }
}

// 설정 모달 열기
function openSettingsModal() {
  const modal = document.getElementById('api-settings-modal');
  document.getElementById('model-select').value = chatConfig.model;
  document.getElementById('system-prompt').value = chatConfig.systemPrompt;
  document.getElementById('temperature').value = chatConfig.temperature;
  document.getElementById('temperature-value').textContent = chatConfig.temperature;
  document.getElementById('max-tokens').value = chatConfig.maxTokens;
  document.getElementById('top-p').value = chatConfig.topP;
  document.getElementById('top-p-value').textContent = chatConfig.topP;
  modal.style.display = 'flex';
}

// 설정 모달 닫기
function closeSettingsModal() {
  const modal = document.getElementById('api-settings-modal');
  modal.style.display = 'none';
}

// 설정 저장
function saveSettings() {
  chatConfig.model = document.getElementById('model-select').value;
  chatConfig.systemPrompt = document.getElementById('system-prompt').value;
  chatConfig.temperature = parseFloat(document.getElementById('temperature').value);
  chatConfig.maxTokens = parseInt(document.getElementById('max-tokens').value);
  chatConfig.topP = parseFloat(document.getElementById('top-p').value);

  localStorage.setItem('chatbot_config', JSON.stringify(chatConfig));
  closeSettingsModal();
  
  // SweetAlert2로 저장 완료 알림
  Swal.fire({
    icon: 'success',
    title: '저장 완료',
    text: 'API 설정이 저장되었습니다.',
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

// 메시지 전송
async function sendMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();

  if (!message) return;
  if (!isApiKeyValid) {
    alert('먼저 API Key를 설정해주세요.');
    return;
  }

  // 사용자 메시지 추가
  addMessage('user', message);
  chatInput.value = '';
  chatInput.style.height = 'auto';

  // 로딩 메시지 표시
  const loadingId = addMessage('assistant', '...', true);

  try {
    const response = await callChatGPTAPI(message);
    updateMessage(loadingId, response);
  } catch (error) {
    updateMessage(loadingId, `오류가 발생했습니다: ${error.message}`);
  }
}

// ChatGPT API 호출
async function callChatGPTAPI(userMessage) {
  // 대화 기록에 사용자 메시지 추가
  chatMessages.push({
    role: 'user',
    content: userMessage
  });

  // GPT-5 모델들은 max_completion_tokens를 사용
  const isGPT5Model = chatConfig.model === 'gpt-5-mini' || chatConfig.model === 'gpt-5.1';
  
  // 요청 body 구성
  const requestBody = {
    model: chatConfig.model,
    messages: [
      { role: 'system', content: chatConfig.systemPrompt },
      ...chatMessages
    ],
    temperature: chatConfig.temperature,
    top_p: chatConfig.topP
  };

  // 모델에 따라 다른 파라미터 사용
  if (isGPT5Model) {
    requestBody.max_completion_tokens = chatConfig.maxTokens;
  } else {
    requestBody.max_tokens = chatConfig.maxTokens;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API 호출 실패');
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message.content;

  // 대화 기록에 어시스턴트 메시지 추가
  chatMessages.push({
    role: 'assistant',
    content: assistantMessage
  });

  return assistantMessage;
}

// 메시지 추가
function addMessage(role, content, isLoading = false) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageId = `msg-${Date.now()}-${Math.random()}`;
  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = `message ${role}-message ${isLoading ? 'loading' : ''}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = content;
  
  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return messageId;
}

// 메시지 업데이트
function updateMessage(messageId, content) {
  const messageDiv = document.getElementById(messageId);
  if (messageDiv) {
    messageDiv.classList.remove('loading');
    const messageContent = messageDiv.querySelector('.message-content');
    messageContent.textContent = content;
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// 챗봇 초기화
initChatbot();

// 피드백 기능 초기화
function initFeedback() {
  // 저장된 설정 불러오기
  const savedConfig = localStorage.getItem('feedback_config');
  if (savedConfig) {
    feedbackConfig = { ...feedbackConfig, ...JSON.parse(savedConfig) };
  }

  // 모달 열기/닫기
  const modal = document.getElementById('feedback-settings-modal');
  const settingsBtn = document.getElementById('feedback-settings-btn');
  const closeBtn = document.getElementById('close-feedback-modal');
  const cancelBtn = document.getElementById('cancel-feedback-settings');

  settingsBtn.addEventListener('click', () => {
    openFeedbackSettingsModal();
  });

  closeBtn.addEventListener('click', closeFeedbackSettingsModal);
  cancelBtn.addEventListener('click', closeFeedbackSettingsModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeFeedbackSettingsModal();
    }
  });

  // 설정 저장
  const saveBtn = document.getElementById('save-feedback-settings');
  saveBtn.addEventListener('click', saveFeedbackSettings);

  // 슬라이더 값 표시
  const temperatureSlider = document.getElementById('feedback-temperature');
  const topPSlider = document.getElementById('feedback-top-p');
  const temperatureValue = document.getElementById('feedback-temperature-value');
  const topPValue = document.getElementById('feedback-top-p-value');

  temperatureSlider.addEventListener('input', (e) => {
    temperatureValue.textContent = e.target.value;
  });

  topPSlider.addEventListener('input', (e) => {
    topPValue.textContent = e.target.value;
  });

  // 피드백 생성 버튼
  const generateBtn = document.getElementById('generate-feedback-btn');
  generateBtn.addEventListener('click', generateFeedback);

  // 예시 글 불러오기 버튼
  const loadExampleBtn = document.getElementById('load-example-btn');
  loadExampleBtn.addEventListener('click', loadExampleText);
}

// 예시 글 불러오기
function loadExampleText() {
  const exampleText = `숙제는 정말 학생을 위한 것일까?

요즘 학교에서 내주는 숙제가 정말로 학생들에게 도움이 되는지에 대해 고민해 본 적이 많다. 선생님들은 숙제가 복습에 도움이 되고 책임감을 길러 준다고 말하지만, 사실 모든 학생이 그렇게 느끼는 것은 아니다. 특히 중학생인 우리는 학원, 동아리, 수행평가 준비까지 해야 해서 숙제를 할 시간 자체가 부족하다. 이렇게 바쁜 상황에서 숙제는 학생들의 스트레스를 더 크게 만드는 주된 원인이라고 볼 수 있다.

첫째, 숙제는 학생들의 자유 시간을 거의 완전히 빼앗는다. 나만 해도 집에 오면 학원에 갔다가 밤 10시에 들어오는데, 그때부터 숙제를 하면 최소한 1시간은 걸린다. 그러면 쉬는 시간 없이 바로 잠들 수밖에 없고, 이는 곧 다음 날 수업 집중력 저하로 이어진다. 실제로 우리 반 친구들 중 많은 수가 아침 조회 시간에 꾸벅꾸벅 조는 것을 보면 숙제가 학생들의 수면 부족을 확실히 만들어 낸다고 할 수 있다. 수면 부족은 건강에 안 좋으니 숙제를 줄이거나 없애야 한다.

둘째, 숙제가 많다고 해서 성적이 반드시 오르는 것도 아니다. 작년에 우리 반에서 가장 성적이 좋았던 친구는 숙제를 자주 안 해 왔다. 그런데도 시험을 잘 본 이유는 수업 시간에만 집중해도 충분했기 때문이다. 이렇게 보면 숙제는 성적을 올리는 데 필수적인 요소가 아니고, 오히려 시간을 빼앗는 존재일 뿐이다. 그렇다면 성적을 올리기 위해서는 숙제가 아니라 수업 중 필기만 열심히 하면 된다고 볼 수 있다.

또한 선생님들도 숙제 때문에 힘들어하신다. 학생들이 낸 과제를 모두 채점하려면 선생님들은 밤늦게까지 학교에 남거나 집에 가져가서까지 일을 해야 한다. 선생님이 피곤하면 수업 준비를 제대로 못 하게 되고, 수업의 질이 떨어질 수밖에 없다. 수업의 질이 떨어지면 학생들은 더 흥미를 잃고, 그러면 숙제를 더 많이 내야 한다는 악순환이 생긴다. 따라서 선생님들의 건강을 위해서라도 숙제는 줄여야 한다.

물론 어떤 사람들은 숙제가 책임감을 기르는 데 꼭 필요하다고 주장한다. 하지만 책임감은 숙제 말고도 충분히 기를 수 있다. 예를 들어 교실 청소 당번을 맡거나, 동아리 활동에서 역할을 수행하는 것도 책임감을 기르는 경험이다. 이미 이런 활동들이 있는데도 숙제까지 해야 한다면 책임감은 커지기보다는 부담감으로 변한다. 부담이 너무 크면 오히려 책임을 피하고 싶어지는 법이므로, 책임감을 기르기 위해 숙제를 유지해야 한다는 주장은 설득력이 떨어진다고 생각한다.

정리하자면, 숙제는 학생들의 자유 시간을 빼앗고, 건강을 해치며, 선생님들에게도 부담을 주기 때문에 없어지는 것이 맞다. 숙제가 사라지면 우리는 더 충분히 쉴 수 있고, 그러면 수업 시간에 집중이 잘 되므로 성적도 자연스럽게 오를 것이다. 결국 숙제를 없애는 것은 학생과 선생님 모두에게 이득이 되는 선택이며, 학교 교육을 더 발전시키는 길이라고 말할 수 있다.`;

  const textInput = document.getElementById('feedback-text-input');
  textInput.value = exampleText;
  textInput.focus();
  
  // 스크롤을 맨 위로
  textInput.scrollTop = 0;
  
  // 알림 표시
  Swal.fire({
    icon: 'success',
    title: '예시 글 불러오기 완료',
    text: '예시 글이 입력창에 붙여넣어졌습니다.',
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

// 피드백 설정 모달 열기
function openFeedbackSettingsModal() {
  const modal = document.getElementById('feedback-settings-modal');
  document.getElementById('feedback-model-select').value = feedbackConfig.model;
  document.getElementById('feedback-system-prompt').value = feedbackConfig.systemPrompt;
  document.getElementById('feedback-temperature').value = feedbackConfig.temperature;
  document.getElementById('feedback-temperature-value').textContent = feedbackConfig.temperature;
  document.getElementById('feedback-max-tokens').value = feedbackConfig.maxTokens;
  document.getElementById('feedback-top-p').value = feedbackConfig.topP;
  document.getElementById('feedback-top-p-value').textContent = feedbackConfig.topP;
  modal.style.display = 'flex';
  setupTooltips();
}

// 피드백 설정 모달 닫기
function closeFeedbackSettingsModal() {
  const modal = document.getElementById('feedback-settings-modal');
  modal.style.display = 'none';
}

// 피드백 설정 저장
function saveFeedbackSettings() {
  feedbackConfig.model = document.getElementById('feedback-model-select').value;
  feedbackConfig.systemPrompt = document.getElementById('feedback-system-prompt').value;
  feedbackConfig.temperature = parseFloat(document.getElementById('feedback-temperature').value);
  feedbackConfig.maxTokens = parseInt(document.getElementById('feedback-max-tokens').value);
  feedbackConfig.topP = parseFloat(document.getElementById('feedback-top-p').value);

  localStorage.setItem('feedback_config', JSON.stringify(feedbackConfig));
  closeFeedbackSettingsModal();
  
  // SweetAlert2로 저장 완료 알림
  Swal.fire({
    icon: 'success',
    title: '저장 완료',
    text: '피드백 API 설정이 저장되었습니다.',
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

// 피드백 생성
async function generateFeedback() {
  const textInput = document.getElementById('feedback-text-input');
  const text = textInput.value.trim();
  const outputDiv = document.getElementById('feedback-output');
  const generateBtn = document.getElementById('generate-feedback-btn');

  if (!text) {
    Swal.fire({
      icon: 'warning',
      title: '글을 입력해주세요',
      text: '피드백을 받을 글을 입력하거나 붙여넣어주세요.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
    return;
  }

  if (!isApiKeyValid) {
    Swal.fire({
      icon: 'error',
      title: 'API Key 필요',
      text: '먼저 API Key를 설정해주세요.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
    return;
  }

  // 로딩 상태
  generateBtn.disabled = true;
  generateBtn.textContent = '생성 중...';
  outputDiv.innerHTML = '<div class="loading-spinner">피드백을 생성하고 있습니다...</div>';

  try {
    const feedback = await callFeedbackAPI(text);
    outputDiv.innerHTML = `<div class="feedback-content">${feedback.replace(/\n/g, '<br>')}</div>`;
  } catch (error) {
    outputDiv.innerHTML = `<div class="error-message">오류가 발생했습니다: ${error.message}</div>`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = '피드백 생성';
  }
}

// 피드백 API 호출
async function callFeedbackAPI(text) {
  // GPT-5 모델들은 max_completion_tokens를 사용
  const isGPT5Model = feedbackConfig.model === 'gpt-5-mini' || feedbackConfig.model === 'gpt-5.1';
  
  // 요청 body 구성
  const requestBody = {
    model: feedbackConfig.model,
    messages: [
      { role: 'system', content: feedbackConfig.systemPrompt },
      { role: 'user', content: `다음 글을 루브릭을 기준으로 평가하고 피드백을 제공해주세요:\n\n${text}` }
    ],
    temperature: feedbackConfig.temperature,
    top_p: feedbackConfig.topP
  };

  // 모델에 따라 다른 파라미터 사용
  if (isGPT5Model) {
    requestBody.max_completion_tokens = feedbackConfig.maxTokens;
  } else {
    requestBody.max_tokens = feedbackConfig.maxTokens;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API 호출 실패');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 피드백 기능 초기화
initFeedback();

// PDF 요약기 기능 초기화
function initPDFSummary() {
  // 저장된 설정 불러오기
  const savedConfig = localStorage.getItem('pdf_summary_config');
  if (savedConfig) {
    pdfSummaryConfig = { ...pdfSummaryConfig, ...JSON.parse(savedConfig) };
  }

  // 모달 열기/닫기
  const modal = document.getElementById('pdf-summary-settings-modal');
  const settingsBtn = document.getElementById('pdf-summary-settings-btn');
  const closeBtn = document.getElementById('close-pdf-summary-modal');
  const cancelBtn = document.getElementById('cancel-pdf-summary-settings');

  settingsBtn.addEventListener('click', () => {
    openPDFSummarySettingsModal();
  });

  closeBtn.addEventListener('click', closePDFSummarySettingsModal);
  cancelBtn.addEventListener('click', closePDFSummarySettingsModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePDFSummarySettingsModal();
    }
  });

  // 설정 저장
  const saveBtn = document.getElementById('save-pdf-summary-settings');
  saveBtn.addEventListener('click', savePDFSummarySettings);

  // 파일 업로드 처리
  const fileInput = document.getElementById('pdf-file-input');
  const uploadArea = document.getElementById('file-upload-area');
  const fileInfo = document.getElementById('pdf-file-info');
  const fileName = document.getElementById('pdf-file-name');
  const removeBtn = document.getElementById('remove-pdf-btn');
  const summarizeBtn = document.getElementById('summarize-pdf-btn');

  fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files[0]);
  });

  // 드래그 앤 드롭
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      fileInput.files = e.dataTransfer.files;
      handleFileSelect(file);
    } else {
      Swal.fire({
        icon: 'error',
        title: '잘못된 파일 형식',
        text: 'PDF 파일만 업로드할 수 있습니다.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  });

  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  removeBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInfo.style.display = 'none';
    summarizeBtn.style.display = 'none';
    uploadArea.style.display = 'block';
  });

  summarizeBtn.addEventListener('click', summarizePDF);

  function handleFileSelect(file) {
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      Swal.fire({
        icon: 'error',
        title: '잘못된 파일 형식',
        text: 'PDF 파일만 업로드할 수 있습니다.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    fileName.textContent = file.name;
    fileInfo.style.display = 'flex';
    summarizeBtn.style.display = 'block';
    uploadArea.style.display = 'none';
  }
}

// PDF 요약 설정 모달 열기
function openPDFSummarySettingsModal() {
  const modal = document.getElementById('pdf-summary-settings-modal');
  document.getElementById('pdf-summary-model-select').value = pdfSummaryConfig.model;
  modal.style.display = 'flex';
  setupTooltips();
}

// PDF 요약 설정 모달 닫기
function closePDFSummarySettingsModal() {
  const modal = document.getElementById('pdf-summary-settings-modal');
  modal.style.display = 'none';
}

// PDF 요약 설정 저장
function savePDFSummarySettings() {
  pdfSummaryConfig.model = document.getElementById('pdf-summary-model-select').value;
  localStorage.setItem('pdf_summary_config', JSON.stringify(pdfSummaryConfig));
  closePDFSummarySettingsModal();
  
  Swal.fire({
    icon: 'success',
    title: '저장 완료',
    text: 'PDF 요약 API 설정이 저장되었습니다.',
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

// PDF 텍스트 추출
async function extractTextFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Vite 환경에서 worker 파일을 public 폴더에서 로드
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText;
}

// PDF 요약
async function summarizePDF() {
  const fileInput = document.getElementById('pdf-file-input');
  const file = fileInput.files[0];
  const outputDiv = document.getElementById('pdf-summary-output');
  const summarizeBtn = document.getElementById('summarize-pdf-btn');

  if (!file) {
    Swal.fire({
      icon: 'warning',
      title: '파일을 선택해주세요',
      text: 'PDF 파일을 업로드해주세요.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
    return;
  }

  if (!isApiKeyValid) {
    Swal.fire({
      icon: 'error',
      title: 'API Key 필요',
      text: '먼저 API Key를 설정해주세요.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
    return;
  }

  // 로딩 상태
  summarizeBtn.disabled = true;
  summarizeBtn.textContent = '처리 중...';
  outputDiv.innerHTML = '<div class="loading-spinner">PDF를 분석하고 요약을 생성하고 있습니다...</div>';

  try {
    // PDF 텍스트 추출
    const pdfText = await extractTextFromPDF(file);
    
    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('PDF에서 텍스트를 추출할 수 없습니다.');
    }

    // 텍스트가 너무 길면 잘라내기 (약 10000자 제한)
    const maxLength = 10000;
    const truncatedText = pdfText.length > maxLength 
      ? pdfText.substring(0, maxLength) + '\n\n[내용이 길어 일부만 요약되었습니다.]'
      : pdfText;

    // 요약 생성
    const summary = await callPDFSummaryAPI(truncatedText);
    outputDiv.innerHTML = `<div class="feedback-content">${summary.replace(/\n/g, '<br>')}</div>`;
  } catch (error) {
    outputDiv.innerHTML = `<div class="error-message">오류가 발생했습니다: ${error.message}</div>`;
  } finally {
    summarizeBtn.disabled = false;
    summarizeBtn.textContent = '요약 생성';
  }
}

// PDF 요약 API 호출
async function callPDFSummaryAPI(pdfText) {
  const isGPT5Model = pdfSummaryConfig.model === 'gpt-5-mini' || pdfSummaryConfig.model === 'gpt-5.1';
  
  const requestBody = {
    model: pdfSummaryConfig.model,
    messages: [
      { 
        role: 'system', 
        content: '당신은 문서 요약 전문가입니다. 제공된 문서의 내용을 명확하고 간결하게 요약해주세요. 주요 내용, 핵심 포인트, 결론을 포함하여 요약해주세요.' 
      },
      { 
        role: 'user', 
        content: `다음 PDF 문서의 내용을 요약해주세요:\n\n${pdfText}` 
      }
    ],
    temperature: 0.7,
    top_p: 1.0
  };

  if (isGPT5Model) {
    requestBody.max_completion_tokens = 2000;
  } else {
    requestBody.max_tokens = 2000;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API 호출 실패');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// PDF 요약기 기능 초기화
initPDFSummary();

// 퀴즈 생성기 기능 초기화
function initQuiz() {
  // 저장된 설정 불러오기
  const savedConfig = localStorage.getItem('quiz_config');
  if (savedConfig) {
    quizConfig = { ...quizConfig, ...JSON.parse(savedConfig) };
  }

  // 모달 열기/닫기
  const modal = document.getElementById('quiz-settings-modal');
  const settingsBtn = document.getElementById('quiz-settings-btn');
  const closeBtn = document.getElementById('close-quiz-modal');
  const cancelBtn = document.getElementById('cancel-quiz-settings');

  settingsBtn.addEventListener('click', () => {
    openQuizSettingsModal();
  });

  closeBtn.addEventListener('click', closeQuizSettingsModal);
  cancelBtn.addEventListener('click', closeQuizSettingsModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeQuizSettingsModal();
    }
  });

  // 설정 저장
  const saveBtn = document.getElementById('save-quiz-settings');
  saveBtn.addEventListener('click', saveQuizSettings);

  // 슬라이더 값 표시
  const temperatureSlider = document.getElementById('quiz-temperature');
  const topPSlider = document.getElementById('quiz-top-p');
  const temperatureValue = document.getElementById('quiz-temperature-value');
  const topPValue = document.getElementById('quiz-top-p-value');

  if (temperatureSlider) {
    temperatureSlider.addEventListener('input', (e) => {
      temperatureValue.textContent = e.target.value;
    });
  }

  if (topPSlider) {
    topPSlider.addEventListener('input', (e) => {
      topPValue.textContent = e.target.value;
    });
  }

  // 입력 타입 전환
  const inputTabs = document.querySelectorAll('.input-tab');
  const textInputPanel = document.getElementById('text-input-panel');
  const pdfInputPanel = document.getElementById('pdf-input-panel');

  inputTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const inputType = tab.getAttribute('data-input-type');
      
      inputTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      if (textInputPanel && pdfInputPanel) {
        textInputPanel.classList.toggle('active', inputType === 'text');
        pdfInputPanel.classList.toggle('active', inputType === 'pdf');
      }
    });
  });

  // PDF 파일 업로드 처리
  const fileInput = document.getElementById('quiz-pdf-file-input');
  const uploadArea = document.getElementById('quiz-file-upload-area');
  const fileInfo = document.getElementById('quiz-pdf-file-info');
  const fileName = document.getElementById('quiz-pdf-file-name');
  const removeBtn = document.getElementById('remove-quiz-pdf-btn');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleQuizFileSelect(e.target.files[0]);
    });
  }

  // 드래그 앤 드롭
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        fileInput.files = e.dataTransfer.files;
        handleQuizFileSelect(file);
      } else {
        Swal.fire({
          icon: 'error',
          title: '잘못된 파일 형식',
          text: 'PDF 파일만 업로드할 수 있습니다.',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    });

    uploadArea.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      if (fileInput) fileInput.value = '';
      if (fileInfo) fileInfo.style.display = 'none';
      if (uploadArea) uploadArea.style.display = 'block';
    });
  }

  // 퀴즈 생성 버튼
  const generateBtn = document.getElementById('generate-quiz-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateQuiz);
  }

  // 예시 글 불러오기 버튼
  const loadExampleBtn = document.getElementById('load-quiz-example-btn');
  if (loadExampleBtn) {
    loadExampleBtn.addEventListener('click', loadQuizExampleText);
  }

  function handleQuizFileSelect(file) {
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      Swal.fire({
        icon: 'error',
        title: '잘못된 파일 형식',
        text: 'PDF 파일만 업로드할 수 있습니다.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    if (fileName) fileName.textContent = file.name;
    if (fileInfo) fileInfo.style.display = 'flex';
    if (uploadArea) uploadArea.style.display = 'none';
  }
}

// 퀴즈 설정 모달 열기
function openQuizSettingsModal() {
  const modal = document.getElementById('quiz-settings-modal');
  if (!modal) return;
  
  document.getElementById('quiz-model-select').value = quizConfig.model;
  document.getElementById('quiz-system-prompt').value = quizConfig.systemPrompt;
  document.getElementById('quiz-temperature').value = quizConfig.temperature;
  document.getElementById('quiz-temperature-value').textContent = quizConfig.temperature;
  document.getElementById('quiz-max-tokens').value = quizConfig.maxTokens;
  document.getElementById('quiz-top-p').value = quizConfig.topP;
  document.getElementById('quiz-top-p-value').textContent = quizConfig.topP;
  modal.style.display = 'flex';
  setupTooltips();
}

// 퀴즈 설정 모달 닫기
function closeQuizSettingsModal() {
  const modal = document.getElementById('quiz-settings-modal');
  if (modal) modal.style.display = 'none';
}

// 퀴즈 설정 저장
function saveQuizSettings() {
  quizConfig.model = document.getElementById('quiz-model-select').value;
  quizConfig.systemPrompt = document.getElementById('quiz-system-prompt').value;
  quizConfig.temperature = parseFloat(document.getElementById('quiz-temperature').value);
  quizConfig.maxTokens = parseInt(document.getElementById('quiz-max-tokens').value);
  quizConfig.topP = parseFloat(document.getElementById('quiz-top-p').value);

  localStorage.setItem('quiz_config', JSON.stringify(quizConfig));
  closeQuizSettingsModal();
  
  Swal.fire({
    icon: 'success',
    title: '저장 완료',
    text: '퀴즈 생성 API 설정이 저장되었습니다.',
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

// 퀴즈 생성
async function generateQuiz() {
  const textInput = document.getElementById('quiz-text-input');
  const fileInput = document.getElementById('quiz-pdf-file-input');
  const activeTab = document.querySelector('.input-tab.active');
  const outputDiv = document.getElementById('quiz-output');
  const generateBtn = document.getElementById('generate-quiz-btn');

  if (!activeTab) return;
  
  const inputType = activeTab.getAttribute('data-input-type');
  let sourceText = '';

  // 입력 타입에 따라 텍스트 가져오기
  if (inputType === 'text') {
    sourceText = textInput ? textInput.value.trim() : '';
    if (!sourceText) {
      Swal.fire({
        icon: 'warning',
        title: '텍스트를 입력해주세요',
        text: '퀴즈를 생성할 텍스트를 입력하거나 붙여넣어주세요.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }
  } else {
    const file = fileInput ? fileInput.files[0] : null;
    if (!file) {
      Swal.fire({
        icon: 'warning',
        title: '파일을 선택해주세요',
        text: 'PDF 파일을 업로드해주세요.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    try {
      sourceText = await extractTextFromPDF(file);
      if (!sourceText || sourceText.trim().length === 0) {
        throw new Error('PDF에서 텍스트를 추출할 수 없습니다.');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'PDF 처리 오류',
        text: error.message,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      return;
    }
  }

  if (!isApiKeyValid) {
    Swal.fire({
      icon: 'error',
      title: 'API Key 필요',
      text: '먼저 API Key를 설정해주세요.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
    return;
  }

  // 텍스트가 너무 길면 잘라내기
  const maxLength = 10000;
  const truncatedText = sourceText.length > maxLength 
    ? sourceText.substring(0, maxLength) + '\n\n[내용이 길어 일부만 사용되었습니다.]'
    : sourceText;

  // 로딩 상태
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = '생성 중...';
  }
  if (outputDiv) {
    outputDiv.innerHTML = '<div class="loading-spinner">퀴즈를 생성하고 있습니다...</div>';
  }

  try {
    const quiz = await callQuizAPI(truncatedText);
    if (outputDiv) {
      outputDiv.innerHTML = `<div class="feedback-content">${quiz.replace(/\n/g, '<br>')}</div>`;
    }
  } catch (error) {
    if (outputDiv) {
      outputDiv.innerHTML = `<div class="error-message">오류가 발생했습니다: ${error.message}</div>`;
    }
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = '퀴즈 생성';
    }
  }
}

// 퀴즈 생성 API 호출
async function callQuizAPI(sourceText) {
  const isGPT5Model = quizConfig.model === 'gpt-5-mini' || quizConfig.model === 'gpt-5.1';
  
  const requestBody = {
    model: quizConfig.model,
    messages: [
      { role: 'system', content: quizConfig.systemPrompt },
      { 
        role: 'user', 
        content: `다음 텍스트를 기반으로 학습에 도움이 되는 퀴즈를 생성해주세요. 각 퀴즈에는 문제, 정답, 그리고 상세한 해설을 포함해주세요. 퀴즈는 객관식 또는 주관식 형태로 다양하게 만들어주세요.\n\n텍스트:\n${sourceText}` 
      }
    ],
    temperature: quizConfig.temperature,
    top_p: quizConfig.topP
  };

  if (isGPT5Model) {
    requestBody.max_completion_tokens = quizConfig.maxTokens;
  } else {
    requestBody.max_tokens = quizConfig.maxTokens;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API 호출 실패');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 예시 글 불러오기 (퀴즈)
function loadQuizExampleText() {
  const exampleText = `현대 사회에서 금융과 경제는 일상생활과 매우 밀접하게 연결되어 있다. 먼저 금융은 사람들이 돈을 모으고 빌리고 관리하는 모든 활동을 의미한다. 대표적인 금융 기관에는 은행, 증권사, 보험사가 있으며, 이들은 예금, 대출, 투자, 보험과 같은 다양한 서비스를 제공한다. 예를 들어 은행에 돈을 맡기면 일정한 비율의 이자를 받을 수 있는데, 이때 이자율이 높을수록 예금자는 더 많은 이익을 얻게 된다.

한편 경제는 한 사회에서 재화와 서비스를 어떻게 생산하고 소비하고 분배하는지를 다루는 분야이다. 경제의 흐름을 이해하기 위해 자주 사용되는 개념 중 하나가 인플레이션이다. 인플레이션이란 물가가 전반적으로 상승하여 같은 금액으로 살 수 있는 물건의 양이 줄어드는 현상이다. 예를 들어 작년에 1,000원이던 우유 한 팩이 올해 1,200원이 되었다면, 이는 물가가 오른 것이고 화폐의 구매력이 떨어졌다는 뜻이다.

금융과 경제는 서로 깊게 연결되어 있기 때문에, 경제 상황이 변화하면 금융 시장에도 큰 영향을 미친다. 예를 들어 중앙은행이 기준금리를 인상하면 대출이 어려워지고, 기업들은 투자를 줄이는 경향이 있다. 반대로 금리를 낮추면 사람들은 대출을 더 쉽게 받아 소비나 투자를 늘릴 수 있다. 이러한 과정은 국가 경제의 성장 속도에도 영향을 미치기 때문에, 금리 정책은 매우 중요한 경제 정책 중 하나로 여겨진다.

마지막으로, 금융과 경제를 이해하는 것은 개인의 생활에도 직접적인 도움을 준다. 적절한 금융 지식을 갖추면 불필요한 소비를 줄이고, 자신의 소득과 지출을 효과적으로 관리할 수 있다. 또한 경제 뉴스나 금융 상품의 조건을 이해할 수 있기 때문에 더 현명한 재테크 결정을 내릴 수 있다. 이처럼 금융·경제 상식은 현대 사회를 살아가는 데 꼭 필요한 기본 역량이라고 할 수 있다.`;

  const textInput = document.getElementById('quiz-text-input');
  if (textInput) {
    textInput.value = exampleText;
    textInput.focus();
    textInput.scrollTop = 0;
    
    // 텍스트 입력 탭으로 전환
    const textTab = document.querySelector('.input-tab[data-input-type="text"]');
    if (textTab) {
      textTab.click();
    }
    
    // 알림 표시
    Swal.fire({
      icon: 'success',
      title: '예시 글 불러오기 완료',
      text: '예시 글이 입력창에 붙여넣어졌습니다.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}

// 퀴즈 생성기 기능 초기화
initQuiz();

// 표 데이터 설명 기능 초기화
function initTable() {
  // 저장된 설정 불러오기
  const savedConfig = localStorage.getItem('table_config');
  if (savedConfig) {
    tableConfig = { ...tableConfig, ...JSON.parse(savedConfig) };
  }

  // Handsontable 초기화
  const container = document.getElementById('table-editor');
  if (container) {
    hotInstance = new Handsontable(container, {
      data: [['', '', '', '']],
      colHeaders: true,
      rowHeaders: true,
      width: '100%',
      height: 400,
      licenseKey: 'non-commercial-and-evaluation',
      stretchH: 'all',
      stretchV: 'all',
      autoWrapRow: true,
      autoWrapCol: true,
      contextMenu: true,
      manualColumnResize: true,
      manualRowResize: true,
      filters: true,
      dropdownMenu: true
    });
  }

  // 모달 열기/닫기
  const modal = document.getElementById('table-settings-modal');
  const settingsBtn = document.getElementById('table-settings-btn');
  const closeBtn = document.getElementById('close-table-modal');
  const cancelBtn = document.getElementById('cancel-table-settings');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      openTableSettingsModal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeTableSettingsModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeTableSettingsModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeTableSettingsModal();
      }
    });
  }

  // 설정 저장
  const saveBtn = document.getElementById('save-table-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveTableSettings);
  }

  // 슬라이더 값 표시
  const temperatureSlider = document.getElementById('table-temperature');
  const topPSlider = document.getElementById('table-top-p');
  const temperatureValue = document.getElementById('table-temperature-value');
  const topPValue = document.getElementById('table-top-p-value');

  if (temperatureSlider) {
    temperatureSlider.addEventListener('input', (e) => {
      if (temperatureValue) temperatureValue.textContent = e.target.value;
    });
  }

  if (topPSlider) {
    topPSlider.addEventListener('input', (e) => {
      if (topPValue) topPValue.textContent = e.target.value;
    });
  }

  // 자료 해석 생성 버튼
  const generateBtn = document.getElementById('generate-table-analysis-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateTableAnalysis);
  }

  // 예시 데이터 불러오기 버튼
  const loadExampleBtn = document.getElementById('load-table-example-btn');
  if (loadExampleBtn) {
    loadExampleBtn.addEventListener('click', loadTableExampleData);
  }
}

// 표 설정 모달 열기
function openTableSettingsModal() {
  const modal = document.getElementById('table-settings-modal');
  if (!modal) return;
  
  document.getElementById('table-model-select').value = tableConfig.model;
  document.getElementById('table-system-prompt').value = tableConfig.systemPrompt;
  document.getElementById('table-temperature').value = tableConfig.temperature;
  document.getElementById('table-temperature-value').textContent = tableConfig.temperature;
  document.getElementById('table-max-tokens').value = tableConfig.maxTokens;
  document.getElementById('table-top-p').value = tableConfig.topP;
  document.getElementById('table-top-p-value').textContent = tableConfig.topP;
  modal.style.display = 'flex';
  setupTooltips();
}

// 표 설정 모달 닫기
function closeTableSettingsModal() {
  const modal = document.getElementById('table-settings-modal');
  if (modal) modal.style.display = 'none';
}

// 표 설정 저장
function saveTableSettings() {
  tableConfig.model = document.getElementById('table-model-select').value;
  tableConfig.systemPrompt = document.getElementById('table-system-prompt').value;
  tableConfig.temperature = parseFloat(document.getElementById('table-temperature').value);
  tableConfig.maxTokens = parseInt(document.getElementById('table-max-tokens').value);
  tableConfig.topP = parseFloat(document.getElementById('table-top-p').value);

  localStorage.setItem('table_config', JSON.stringify(tableConfig));
  closeTableSettingsModal();
  
  Swal.fire({
    icon: 'success',
    title: '저장 완료',
    text: '표 데이터 설명 API 설정이 저장되었습니다.',
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}

// CSV를 배열로 변환
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
}

// 예시 데이터 불러오기
async function loadTableExampleData() {
  try {
    const response = await fetch('/sample-data-table-feedback.csv');
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    if (hotInstance) {
      hotInstance.loadData(data);
      
      Swal.fire({
        icon: 'success',
        title: '예시 데이터 불러오기 완료',
        text: '예시 데이터가 표에 로드되었습니다.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: '오류',
      text: '예시 데이터를 불러오는 중 오류가 발생했습니다.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}

// 표 데이터를 텍스트로 변환
function tableDataToText() {
  if (!hotInstance) return '';
  
  const data = hotInstance.getData();
  const colHeaders = hotInstance.getColHeader();
  
  // 빈 행과 열 제거
  const filteredData = data.filter(row => row.some(cell => cell !== null && cell !== ''));
  if (filteredData.length === 0) return '';
  
  // 헤더가 있으면 사용, 없으면 첫 번째 행을 헤더로
  const headers = colHeaders && colHeaders.length > 0 
    ? colHeaders 
    : (filteredData[0] || []);
  
  // 데이터 행
  const dataRows = colHeaders && colHeaders.length > 0 
    ? filteredData 
    : filteredData.slice(1);
  
  // 표 형식으로 변환
  let text = '표 데이터:\n\n';
  text += headers.join(' | ') + '\n';
  text += headers.map(() => '---').join(' | ') + '\n';
  
  dataRows.forEach(row => {
    text += row.map(cell => cell || '').join(' | ') + '\n';
  });
  
  return text;
}

// 자료 해석 생성
async function generateTableAnalysis() {
  const outputDiv = document.getElementById('table-analysis-output');
  const generateBtn = document.getElementById('generate-table-analysis-btn');

  if (!hotInstance) {
    Swal.fire({
      icon: 'error',
      title: '오류',
      text: '표 편집기가 초기화되지 않았습니다.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
    return;
  }

  const tableText = tableDataToText();
  if (!tableText || tableText.trim().length < 20) {
    Swal.fire({
      icon: 'warning',
      title: '데이터를 입력해주세요',
      text: '표에 데이터를 입력하거나 예시 데이터를 불러와주세요.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
    return;
  }

  if (!isApiKeyValid) {
    Swal.fire({
      icon: 'error',
      title: 'API Key 필요',
      text: '먼저 API Key를 설정해주세요.',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
    return;
  }

  // 로딩 상태
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = '생성 중...';
  }
  if (outputDiv) {
    outputDiv.innerHTML = '<div class="loading-spinner">자료 해석을 생성하고 있습니다...</div>';
  }

  try {
    const analysis = await callTableAnalysisAPI(tableText);
    
    // 응답이 비어있는지 확인
    if (!analysis || analysis.trim() === '') {
      throw new Error('응답이 비어있습니다. API 설정을 확인하거나 다시 시도해주세요.');
    }
    
    if (outputDiv) {
      outputDiv.innerHTML = `<div class="feedback-content">${analysis.replace(/\n/g, '<br>')}</div>`;
    }
  } catch (error) {
    console.error('표 데이터 해석 오류:', error);
    if (outputDiv) {
      outputDiv.innerHTML = `<div class="error-message">오류가 발생했습니다: ${error.message}</div>`;
    }
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = '자료 해석 생성';
    }
  }
}

// 표 데이터 해석 API 호출
async function callTableAnalysisAPI(tableText) {
  const isGPT5Model = tableConfig.model === 'gpt-5-mini' || tableConfig.model === 'gpt-5.1';
  
  const requestBody = {
    model: tableConfig.model,
    messages: [
      { role: 'system', content: tableConfig.systemPrompt },
      { 
        role: 'user', 
        content: `다음 표 데이터를 분석하고 해석해주세요. 데이터의 패턴, 추세, 특징, 그리고 의미 있는 인사이트를 포함하여 설명해주세요.\n\n${tableText}` 
      }
    ],
    temperature: tableConfig.temperature,
    top_p: tableConfig.topP
  };

  if (isGPT5Model) {
    // GPT-5 모델은 최소 4000 토큰 보장
    requestBody.max_completion_tokens = Math.max(tableConfig.maxTokens, 4000);
  } else {
    requestBody.max_tokens = tableConfig.maxTokens;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API 호출 실패');
  }

  const data = await response.json();
  
  // 응답 검증
  if (!data || !data.choices || !data.choices[0]) {
    console.error('API 응답 데이터:', data);
    throw new Error('API 응답 형식이 올바르지 않습니다.');
  }
  
  const choice = data.choices[0];
  
  // GPT-5 모델의 경우 응답 구조가 다를 수 있음
  let content = null;
  
  // 여러 가능한 경로 확인
  if (choice.message?.content) {
    content = choice.message.content;
  } else if (choice.delta?.content) {
    content = choice.delta.content;
  } else if (choice.text) {
    content = choice.text;
  } else if (typeof choice.message === 'string') {
    content = choice.message;
  }
  
  // finish_reason이 "length"인 경우 토큰 제한에 걸린 것
  if (choice.finish_reason === 'length') {
    if (!content || content.trim() === '') {
      throw new Error('응답이 토큰 제한에 걸려 잘렸습니다. Max Tokens 값을 늘려주세요. (현재: ' + tableConfig.maxTokens + ')');
    } else {
      // 일부 내용이 있으면 경고와 함께 반환
      console.warn('응답이 토큰 제한에 걸려 일부만 반환되었습니다.');
      return content + '\n\n[응답이 토큰 제한에 걸려 일부만 표시됩니다. 더 긴 응답을 원하시면 Max Tokens 값을 늘려주세요.]';
    }
  }
  
  // content가 없으면 전체 choice 객체 로그
  if (!content || content.trim() === '') {
    console.error('빈 응답 데이터:', data);
    console.error('Choice 객체 상세:', JSON.stringify(choice, null, 2));
    
    // finish_reason에 따른 추가 정보 제공
    if (choice.finish_reason) {
      throw new Error(`응답이 완료되지 않았습니다. (finish_reason: ${choice.finish_reason}). Max Tokens 값을 늘리거나 다른 설정을 조정해주세요.`);
    }
    
    throw new Error('응답 내용이 비어있습니다. 모델 설정을 확인하거나 다시 시도해주세요.');
  }
  
  return content;
}

// 표 데이터 설명 기능 초기화
initTable();
