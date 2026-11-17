<?php
// api/generate.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// 1. Get the emotion from the Astro frontend
$input = json_decode(file_get_contents('php://input'), true);
$emotion = $input['emotion'] ?? 'peace';



// 2. Call Gemini API to write the prayer
$gemini_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' . $gemini_api_key;
$gemini_data = [
    "contents" => [
        ["parts" => [["text" => "Write a short, comforting Christian prayer (about 60 words) for someone feeling " . $emotion . "."]]]
    ]
];

$ch_gemini = curl_init($gemini_url);
curl_setopt($ch_gemini, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_gemini, CURLOPT_POST, true);
curl_setopt($ch_gemini, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch_gemini, CURLOPT_POSTFIELDS, json_encode($gemini_data));
$gemini_response = curl_exec($ch_gemini);
curl_close($ch_gemini);

$gemini_json = json_decode($gemini_response, true);
$prayer_text = $gemini_json['candidates'][0]['content']['parts'][0]['text'] ?? "Lord, please bring peace to this heart.";

// 3. Call OpenAI API for Text-to-Speech
$openai_data = [
    'model' => 'tts-1',
    'input' => $prayer_text,
    'voice' => 'shimmer' // Warm, calming female voice
];

$ch_openai = curl_init('https://api.openai.com/v1/audio/speech');
curl_setopt($ch_openai, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_openai, CURLOPT_POST, true);
curl_setopt($ch_openai, CURLOPT_POSTFIELDS, json_encode($openai_data));
curl_setopt($ch_openai, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $openai_api_key,
    'Content-Type: application/json'
]);
$audio_response = curl_exec($ch_openai);
curl_close($ch_openai);

// 4. Save the MP3 file locally on the PHP server
$file_name = 'prayer_' . time() . '.mp3';
$file_path = __DIR__ . '/audio/' . $file_name;
file_put_contents($file_path, $audio_response);

// 5. Return both the text and the audio URL back to Astro
echo json_encode([
    'text' => $prayer_text,
    // Replace with your actual PHP server domain
    'audio_url' => 'https://your-php-server.com/api/audio/' . $file_name 
]);
?>