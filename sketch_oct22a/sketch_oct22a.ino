
#include <Arduino.h>
#include <math.h>

const unsigned long INTERVAL = 5000;
unsigned long lastUpdate = 0;

// Temperature and Humidity
float temperature = 27.9;
float humidity = 60.0;

// Motion Sensor
bool motion = false;

// Vibration Sensor
const char* VIBRATION_STATUS = "STABLE";

// LiDAR Sensor
const float LIDAR_DISTANCE_MM = 157.0;

// Simulated Smoke Sensor
int smokeValue = 7;

// Water Level Sensor
const int WATER_LEVEL = 0;

// Accelerometer (m/s^2)
float accelX = 0.02;
float accelY = -0.01;
float accelZ = 9.81;

// Gyroscope (degrees/second)
float gyroX = 0.05;
float gyroY = -0.03;
float gyroZ = 0.02;

// MPU6050 orientation
float tiltAngle = 0.0;
const char* MPU_STATUS = "STABLE";

float fluctuate(float current,
                float minimum,
                float maximum,
                float stepAmount) {
  int direction = random(-100, 101);

  float change = (direction / 100.0) * stepAmount;
  current += change;

  if (current < minimum) current = minimum;
  if (current > maximum) current = maximum;

  return current;
}

void updateSensors() {
  temperature = fluctuate(temperature, 27.1, 28.7, 0.10);
  humidity = fluctuate(humidity, 59.2, 60.8, 0.15);

  motion = (random(0, 5) == 0);
  smokeValue = random(5, 11);

  accelX = fluctuate(accelX, -0.08, 0.08, 0.02);
  accelY = fluctuate(accelY, -0.08, 0.08, 0.02);
  accelZ = fluctuate(accelZ, 9.76, 9.86, 0.02);

  gyroX = fluctuate(gyroX, -0.15, 0.15, 0.04);
  gyroY = fluctuate(gyroY, -0.15, 0.15, 0.04);
  gyroZ = fluctuate(gyroZ, -0.15, 0.15, 0.04);

  tiltAngle = atan2(
      sqrt(accelX * accelX + accelY * accelY),
      accelZ
  ) * 180.0 / PI;
}

// =============================================
// SERIAL MONITOR SENSOR DISPLAY
// =============================================

void printSensors() {
  Serial.println();
  Serial.println("================================================");
  Serial.println("       VIT CHENNAI DISASTER MONITORING NODE");
  Serial.println("================================================");

  Serial.print(" Temperature     : ");
  Serial.print(temperature, 1);
  Serial.println(" C");

  Serial.print(" Humidity        : ");
  Serial.print(humidity, 1);
  Serial.println(" %");

  Serial.print(" Motion Sensor   : ");
  Serial.println(motion ? "DETECTED" : "CLEAR");

  Serial.print(" Vibration       : ");
  Serial.println(VIBRATION_STATUS);

  Serial.print(" LiDAR Distance  : ");
  Serial.print(LIDAR_DISTANCE_MM, 0);
  Serial.println(" mm");

  Serial.print(" Smoke Sensor    : ");
  Serial.println(smokeValue);

  Serial.print(" Water Level     : ");
  Serial.println(WATER_LEVEL);

  Serial.println("------------------------------------------------");
  Serial.println("              MPU6050 IMU DATA");
  Serial.println("------------------------------------------------");

  Serial.print(" Acceleration X  : ");
  Serial.print(accelX, 2);
  Serial.println(" m/s2");

  Serial.print(" Acceleration Y  : ");
  Serial.print(accelY, 2);
  Serial.println(" m/s2");

  Serial.print(" Acceleration Z  : ");
  Serial.print(accelZ, 2);
  Serial.println(" m/s2");

  Serial.print(" Gyroscope X     : ");
  Serial.print(gyroX, 2);
  Serial.println(" deg/s");

  Serial.print(" Gyroscope Y     : ");
  Serial.print(gyroY, 2);
  Serial.println(" deg/s");

  Serial.print(" Gyroscope Z     : ");
  Serial.print(gyroZ, 2);
  Serial.println(" deg/s");

  Serial.print(" Tilt Angle      : ");
  Serial.print(tiltAngle, 2);
  Serial.println(" degrees");

  Serial.print(" MPU6050 Status  : ");
  Serial.println(MPU_STATUS);

  Serial.println("------------------------------------------------");
  Serial.println("               HAZARD ANALYSIS");
  Serial.println("------------------------------------------------");

  // Demonstration only: values are simulated.
  bool smokeHazard = (smokeValue > 10);
  bool floodHazard = (WATER_LEVEL > 0);
  bool tiltHazard = (tiltAngle > 15.0);

  if (smokeHazard || floodHazard || tiltHazard) {
    Serial.println(" Hazard Status   : WARNING");
  } else {
    Serial.println(" Hazard Status   : NORMAL");
  }

  Serial.println(" Telemetry       : SIMULATED");
  Serial.println(" Update Interval : 5 seconds");
  Serial.println("================================================");
}

// =============================================
// ESP32 SETUP
// =============================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  randomSeed(micros());

  Serial.println();
  Serial.println("================================================");
  Serial.println("   AUTONOMOUS DISASTER DETECTION SYSTEM");
  Serial.println("          VIT CHENNAI - ESP32");
  Serial.println("================================================");

  Serial.println(" System Initializing...");
  Serial.println(" Mode: Simulated Sensor Telemetry");

  Serial.println(" Temperature : 27.1 - 28.7 C");
  Serial.println(" Humidity    : Around 60%");
  Serial.println(" Smoke       : 5 - 10");
  Serial.println(" Water Level : 0");
  Serial.println(" Vibration   : STABLE");
  Serial.println(" LiDAR       : 157 mm");
  Serial.println(" MPU6050     : Simulated IMU");

  Serial.println(" Update every 5 seconds");
  Serial.println("================================================");
}

// =============================================
// MAIN LOOP
// =============================================

void loop() {
  unsigned long currentTime = millis();

  if (currentTime - lastUpdate >= INTERVAL ||
      lastUpdate == 0) {
    lastUpdate = currentTime;

    updateSensors();
    printSensors();
  }

  delay(20);
}
