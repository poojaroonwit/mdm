-- Check Chatbots
SELECT id, name, primary_color FROM chatbots WHERE primary_color = '#db2777';

-- Check Chatbot Versions
SELECT id, version, CAST(config AS TEXT) as config_text 
FROM chatbot_versions 
WHERE CAST(config AS TEXT) LIKE '%#db2777%';

