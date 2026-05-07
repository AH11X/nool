import os
from crewai import Agent, Task, Crew

# 1. إعدادات Kimi والمفتاح الخاص فيك
os.environ["OPENAI_API_KEY"] = "sk-jeE6g9P3mSOkxLGr7GFT0xJVVDS6zQcuHfpXTgz8PwnmplPd"
os.environ["OPENAI_API_BASE"] = "https://api.moonshot.cn/v1" 
os.environ["OPENAI_MODEL_NAME"] = "moonshot-v1-8k" 

# 2. صناعة الوكيل (Agent)
my_agent = Agent(
    role='مستشار ترحيبي',
    goal='كتابة رسالة ترحيبية حماسية',
    backstory='أنت خبير في تحفيز المبرمجين الجدد الذين يتعلمون الذكاء الاصطناعي.',
    verbose=True 
)

# 3. تحديد المهمة (Task)
my_task = Task(
    description='اكتب رسالة ترحيب قصيرة جداً (سطرين فقط) لشخص اسمه أحمد يبني أول وكيل ذكي (Agent) له اليوم.',
    expected_output='رسالة ترحيبية من سطرين',
    agent=my_agent
)

# 4. تجميع الفريق وتشغيله (Crew)
my_crew = Crew(
    agents=[my_agent],
    tasks=[my_task]
)

print("جاري تشغيل الوكيل الذكي يا أحمد... ثواني بس!")
result = my_crew.kickoff()

print("\n=======================")
print("النتيجة النهائية:")
print(result)
print("=======================")