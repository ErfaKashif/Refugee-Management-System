-- ============================================================
-- REFUGEE MANAGEMENT SYSTEM

-- ============================================================
-- SEQUENCES
-- ============================================================
CREATE SEQUENCE SEQ_ORG         START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_COORDINATOR START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_SHELTER     START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_CAMP        START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_DOCTOR      START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_REFUGEE     START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_CONTACT     START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_FAMILY      START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_MEDREC      START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_INVENTORY   START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_VOLUNTEER   START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_INCIDENT    START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_DONATION    START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_USERS       START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_AID       START WITH 1 INCREMENT BY 1;

-- ============================================================
-- 1. ORGANIZATION
-- ============================================================
CREATE TABLE Organization (
  Org_id  NUMBER PRIMARY KEY,
  name    VARCHAR2(100) NOT NULL,
  phone   VARCHAR2(20),
  email   VARCHAR2(100)
);

CREATE OR REPLACE TRIGGER trg_org_id
BEFORE INSERT ON Organization
FOR EACH ROW
BEGIN
  :NEW.Org_id := SEQ_ORG.NEXTVAL;
END;
/

-- ============================================================
-- 2. COORDINATOR
-- ============================================================
CREATE TABLE Coordinator (
  Coordinator_id   NUMBER PRIMARY KEY,
  Coordinator_name VARCHAR2(100) NOT NULL,
  Phone            VARCHAR2(20),
  Email            VARCHAR2(100) UNIQUE
);

CREATE OR REPLACE TRIGGER trg_coordinator_id
BEFORE INSERT ON Coordinator
FOR EACH ROW
BEGIN
  :NEW.Coordinator_id := SEQ_COORDINATOR.NEXTVAL;
END;
/

-- ============================================================
-- 3. SHELTER
-- ============================================================
CREATE TABLE Shelter (
  Shelter_id        NUMBER PRIMARY KEY,
  Shelter_name      VARCHAR2(100) NOT NULL,
  Total_capacity    NUMBER NOT NULL,
  Curr_capacity     NUMBER DEFAULT 0,
  Critical_patients NUMBER DEFAULT 0,
  Coordinator_id    NUMBER,
  CONSTRAINT fk_shelter_coord FOREIGN KEY (Coordinator_id)
    REFERENCES Coordinator(Coordinator_id)
);

CREATE OR REPLACE TRIGGER trg_shelter_id
BEFORE INSERT ON Shelter
FOR EACH ROW
BEGIN
  :NEW.Shelter_id := SEQ_SHELTER.NEXTVAL;
END;
/

-- ============================================================
-- 4. CAMP
-- ============================================================
CREATE TABLE Camp (
  Camp_id        NUMBER PRIMARY KEY,
  Camp_name      VARCHAR2(100) NOT NULL,
  Location       VARCHAR2(200),
  Shelter_id     NUMBER NOT NULL,
  Curr_capacity  NUMBER DEFAULT 0,
  Total_capacity NUMBER NOT NULL,
  CONSTRAINT fk_camp_shelter FOREIGN KEY (Shelter_id)
    REFERENCES Shelter(Shelter_id)
);

CREATE OR REPLACE TRIGGER trg_camp_id
BEFORE INSERT ON Camp
FOR EACH ROW
BEGIN
  :NEW.Camp_id := SEQ_CAMP.NEXTVAL;
END;
/

-- ============================================================
-- 5. DOCTOR
-- ============================================================
CREATE TABLE Doctor (
  Doctor_id      NUMBER PRIMARY KEY,
  name           VARCHAR2(100) NOT NULL,
  Specialization VARCHAR2(100),
  Salary         NUMBER(10,2),
  HoursPerWeek   NUMBER,
  HireDate       DATE,
  Shelter_id     NUMBER,
  Coordinator_id NUMBER,
  CONSTRAINT fk_doctor_shelter FOREIGN KEY (Shelter_id)
    REFERENCES Shelter(Shelter_id),
  CONSTRAINT fk_doctor_coord FOREIGN KEY (Coordinator_id)
    REFERENCES Coordinator(Coordinator_id)
);

CREATE OR REPLACE TRIGGER trg_doctor_id
BEFORE INSERT ON Doctor
FOR EACH ROW
BEGIN
  :NEW.Doctor_id := SEQ_DOCTOR.NEXTVAL;
END;
/

-- ============================================================
-- 6. REFUGEE
-- ============================================================
CREATE TABLE Refugee (
  Refugee_id    NUMBER PRIMARY KEY,
  name          VARCHAR2(100) NOT NULL,
  DOB           DATE,
  Gender        CHAR(1) CHECK (Gender IN ('M','F','O')),
  Nationality   VARCHAR2(100),
  In_date       DATE DEFAULT SYSDATE,
  Vulnerability VARCHAR2(200),
  Status        VARCHAR2(20) DEFAULT 'ACTIVE'
                CHECK (Status IN ('ACTIVE','RELOCATED','DEPARTED')),
  Has_Family    CHAR(1) DEFAULT 'N' CHECK (Has_Family IN ('Y','N')),
  Shelter_id    NUMBER,
  Camp_id       NUMBER,
  CONSTRAINT fk_refugee_shelter FOREIGN KEY (Shelter_id)
    REFERENCES Shelter(Shelter_id),
  CONSTRAINT fk_refugee_camp FOREIGN KEY (Camp_id)
    REFERENCES Camp(Camp_id)
);

CREATE OR REPLACE TRIGGER trg_refugee_id
BEFORE INSERT ON Refugee
FOR EACH ROW
BEGIN
  :NEW.Refugee_id := SEQ_REFUGEE.NEXTVAL;
END;
/

-- ============================================================
-- 7. REFUGEE_CONTACT
-- ============================================================
CREATE TABLE Refugee_Contact (
  Contact_id NUMBER PRIMARY KEY,
  Refugee_id NUMBER NOT NULL,
  Relation   VARCHAR2(50),
  Email      VARCHAR2(100),
  Phone      VARCHAR2(20),
  CONSTRAINT fk_contact_refugee FOREIGN KEY (Refugee_id)
    REFERENCES Refugee(Refugee_id) ON DELETE CASCADE
);

CREATE OR REPLACE TRIGGER trg_contact_id
BEFORE INSERT ON Refugee_Contact
FOR EACH ROW
BEGIN
  :NEW.Contact_id := SEQ_CONTACT.NEXTVAL;
END;
/

-- ============================================================
-- 8. REFUGEE_FAMILY
-- ============================================================
CREATE TABLE Refugee_Family (
  Family_id   NUMBER PRIMARY KEY,
  Refugee_id  NUMBER NOT NULL,
  Ref_Head_id NUMBER,
  Relation    VARCHAR2(50),
  CONSTRAINT fk_family_refugee FOREIGN KEY (Refugee_id)
    REFERENCES Refugee(Refugee_id) ON DELETE CASCADE,
  CONSTRAINT fk_family_head FOREIGN KEY (Ref_Head_id)
    REFERENCES Refugee(Refugee_id)
);

CREATE OR REPLACE TRIGGER trg_family_id
BEFORE INSERT ON Refugee_Family
FOR EACH ROW
BEGIN
  :NEW.Family_id := SEQ_FAMILY.NEXTVAL;
END;
/

-- ============================================================
-- 9. MEDICAL_RECORD
-- ============================================================
CREATE TABLE Medical_Record (
  Record_id   NUMBER PRIMARY KEY,
  Refugee_id  NUMBER NOT NULL,
  Record_date DATE DEFAULT SYSDATE,
  Doctor_id   NUMBER,
  Diagnosis   VARCHAR2(300),
  Treatment   VARCHAR2(300),
  Is_Critical CHAR(1) DEFAULT 'N' CHECK (Is_Critical IN ('Y','N')),
  CONSTRAINT fk_medrec_refugee FOREIGN KEY (Refugee_id)
    REFERENCES Refugee(Refugee_id) ON DELETE CASCADE,
  CONSTRAINT fk_medrec_doctor FOREIGN KEY (Doctor_id)
    REFERENCES Doctor(Doctor_id)
);

CREATE OR REPLACE TRIGGER trg_medrec_id
BEFORE INSERT ON Medical_Record
FOR EACH ROW
BEGIN
  :NEW.Record_id := SEQ_MEDREC.NEXTVAL;
END;
/

-- ============================================================
-- 10. INVENTORY
-- ============================================================
CREATE TABLE Inventory (
  Product_id   NUMBER PRIMARY KEY,
  Product_name VARCHAR2(100) NOT NULL,
  Category     VARCHAR2(20) CHECK (Category IN ('FOOD','MEDICINE','CLOTHES','OTHER')),
  Shelter_id   NUMBER,
  Quantity     NUMBER DEFAULT 0,
  In_date      DATE DEFAULT SYSDATE,
  Exp_date     DATE,
  Low_alert    NUMBER DEFAULT 10,
  CONSTRAINT fk_inventory_shelter FOREIGN KEY (Shelter_id)
    REFERENCES Shelter(Shelter_id)
);

CREATE OR REPLACE TRIGGER trg_inventory_id
BEFORE INSERT ON Inventory
FOR EACH ROW
BEGIN
  :NEW.Product_id := SEQ_INVENTORY.NEXTVAL;
END;
/

-- ============================================================
-- 11. VOLUNTEER
-- ============================================================
CREATE TABLE Volunteer (
  Volunteer_id      NUMBER PRIMARY KEY,
  name              VARCHAR2(100) NOT NULL,
  Shelter_id        NUMBER,
  Phone             VARCHAR2(20),
  Email             VARCHAR2(100) UNIQUE,
  Emergency_contact VARCHAR2(20),
  Org_id            NUMBER,
  Hours             NUMBER DEFAULT 0,
  Status            VARCHAR2(20) DEFAULT 'ACTIVE'
                    CHECK (Status IN ('ACTIVE','INACTIVE','ON_LEAVE')),
  CONSTRAINT fk_volunteer_shelter FOREIGN KEY (Shelter_id)
    REFERENCES Shelter(Shelter_id),
  CONSTRAINT fk_volunteer_org FOREIGN KEY (Org_id)
    REFERENCES Organization(Org_id)
);

CREATE OR REPLACE TRIGGER trg_volunteer_id
BEFORE INSERT ON Volunteer
FOR EACH ROW
BEGIN
  :NEW.Volunteer_id := SEQ_VOLUNTEER.NEXTVAL;
END;
/

-- ============================================================
-- 12. INCIDENT_REPORT
-- ============================================================
CREATE TABLE Incident_Report (
  Incident_id   NUMBER PRIMARY KEY,
  Shelter_id    NUMBER,
  Refugee_id    NUMBER,
  Volunteer_id  NUMBER,
  Date_reported DATE DEFAULT SYSDATE,
  Description   VARCHAR2(500),
  Severity      VARCHAR2(20) CHECK (Severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  CONSTRAINT fk_incident_shelter FOREIGN KEY (Shelter_id)
    REFERENCES Shelter(Shelter_id),
  CONSTRAINT fk_incident_refugee FOREIGN KEY (Refugee_id)
    REFERENCES Refugee(Refugee_id),
  CONSTRAINT fk_incident_volunteer FOREIGN KEY (Volunteer_id)
    REFERENCES Volunteer(Volunteer_id)
);

CREATE OR REPLACE TRIGGER trg_incident_id
BEFORE INSERT ON Incident_Report
FOR EACH ROW
BEGIN
  :NEW.Incident_id := SEQ_INCIDENT.NEXTVAL;
END;
/

-- ============================================================
-- 13. MONETARY_DONATIONS
-- ============================================================
CREATE TABLE Monetary_Donations (
  Donation_id  NUMBER PRIMARY KEY,
  Donor_name   VARCHAR2(100),
  Org_id       NUMBER,
  Amount       NUMBER(12,2) NOT NULL,
  Donated_date DATE DEFAULT SYSDATE,
  Purpose      VARCHAR2(20) CHECK (Purpose IN ('FOOD','MEDICINE','SHELTER','GENERAL')),
  CONSTRAINT fk_donation_org FOREIGN KEY (Org_id)
    REFERENCES Organization(Org_id)
);

CREATE OR REPLACE TRIGGER trg_donation_id
BEFORE INSERT ON Monetary_Donations
FOR EACH ROW
BEGIN
  :NEW.Donation_id := SEQ_DONATION.NEXTVAL;
END;
/

-- ============================================================
-- 14. USERS
-- ============================================================
CREATE TABLE Users (
  User_id        NUMBER PRIMARY KEY,
  Username       VARCHAR2(50) UNIQUE NOT NULL,
  Password       VARCHAR2(255) NOT NULL,
  Role           VARCHAR2(20) CHECK (Role IN ('ADMIN','COORDINATOR','DOCTOR','VOLUNTEER')),
  Coordinator_id NUMBER,
  Doctor_id      NUMBER,
  Volunteer_id   NUMBER,
  Created_at     DATE DEFAULT SYSDATE,
  CONSTRAINT fk_user_coord     FOREIGN KEY (Coordinator_id) REFERENCES Coordinator(Coordinator_id),
  CONSTRAINT fk_user_doctor    FOREIGN KEY (Doctor_id)      REFERENCES Doctor(Doctor_id),
  CONSTRAINT fk_user_volunteer FOREIGN KEY (Volunteer_id)   REFERENCES Volunteer(Volunteer_id)
);

CREATE OR REPLACE TRIGGER trg_users_id
BEFORE INSERT ON Users
FOR EACH ROW
BEGIN
  :NEW.User_id := SEQ_USERS.NEXTVAL;
END;
/

-- ============================================================
-- 14. USERS
-- ============================================================
CREATE TABLE AID_DISTRIBUTION (
    DISTRIBUTION_ID NUMBER PRIMARY KEY,
    REFUGEE_ID NUMBER NOT NULL,
    ITEM_NAME VARCHAR2(50) NOT NULL,
    QUANTITY NUMBER NOT NULL,
    DISTRIBUTION_DATE DATE DEFAULT SYSDATE,

    CONSTRAINT fk_aid_refugee
    FOREIGN KEY (REFUGEE_ID)
    REFERENCES REFUGEE(REFUGEE_ID)
);
CREATE OR REPLACE TRIGGER trg_aid_id
BEFORE INSERT ON AID_DISTRIBUTION
FOR EACH ROW
BEGIN
  :NEW.DISTRIBUTION_id := SEQ_AID.NEXTVAL;
END;
/

-- ============================================================
-- CAPACITY TRIGGERS
-- ============================================================

-- Shelter capacity on refugee insert/delete
CREATE OR REPLACE TRIGGER trg_shelter_capacity
AFTER INSERT OR DELETE ON Refugee
FOR EACH ROW
BEGIN
  IF INSERTING AND :NEW.Shelter_id IS NOT NULL THEN
    UPDATE Shelter SET Curr_capacity = Curr_capacity + 1
    WHERE Shelter_id = :NEW.Shelter_id;
  ELSIF DELETING AND :OLD.Shelter_id IS NOT NULL THEN
    UPDATE Shelter SET Curr_capacity = Curr_capacity - 1
    WHERE Shelter_id = :OLD.Shelter_id;
  END IF;
END;
/

-- Camp capacity on refugee insert/delete
CREATE OR REPLACE TRIGGER trg_camp_capacity
AFTER INSERT OR DELETE ON Refugee
FOR EACH ROW
BEGIN
  IF INSERTING AND :NEW.Camp_id IS NOT NULL THEN
    UPDATE Camp SET Curr_capacity = Curr_capacity + 1
    WHERE Camp_id = :NEW.Camp_id;
  ELSIF DELETING AND :OLD.Camp_id IS NOT NULL THEN
    UPDATE Camp SET Curr_capacity = Curr_capacity - 1
    WHERE Camp_id = :OLD.Camp_id;
  END IF;
END;
/

-- Shelter capacity when refugee is reassigned
CREATE OR REPLACE TRIGGER trg_shelter_capacity_update
AFTER UPDATE OF Shelter_id ON Refugee
FOR EACH ROW
BEGIN
  IF :OLD.Shelter_id IS NOT NULL THEN
    UPDATE Shelter SET Curr_capacity = Curr_capacity - 1
    WHERE Shelter_id = :OLD.Shelter_id;
  END IF;
  IF :NEW.Shelter_id IS NOT NULL THEN
    UPDATE Shelter SET Curr_capacity = Curr_capacity + 1
    WHERE Shelter_id = :NEW.Shelter_id;
  END IF;
END;
/

-- Camp capacity when refugee is reassigned
CREATE OR REPLACE TRIGGER trg_camp_capacity_update
AFTER UPDATE OF Camp_id ON Refugee
FOR EACH ROW
BEGIN
  IF :OLD.Camp_id IS NOT NULL THEN
    UPDATE Camp SET Curr_capacity = Curr_capacity - 1
    WHERE Camp_id = :OLD.Camp_id;
  END IF;
  IF :NEW.Camp_id IS NOT NULL THEN
    UPDATE Camp SET Curr_capacity = Curr_capacity + 1
    WHERE Camp_id = :NEW.Camp_id;
  END IF;
END;
/

-- Critical patients count in Shelter
CREATE OR REPLACE TRIGGER trg_critical_patients
AFTER INSERT OR UPDATE OF Is_Critical ON Medical_Record
FOR EACH ROW
DECLARE
  v_shelter_id NUMBER;
BEGIN
  SELECT Shelter_id INTO v_shelter_id
  FROM Refugee WHERE Refugee_id = :NEW.Refugee_id;

  IF v_shelter_id IS NOT NULL THEN
    UPDATE Shelter
    SET Critical_patients = (
      SELECT COUNT(*) FROM Medical_Record m
      JOIN Refugee r ON m.Refugee_id = r.Refugee_id
      WHERE r.Shelter_id = v_shelter_id AND m.Is_Critical = 'Y'
    )
    WHERE Shelter_id = v_shelter_id;
  END IF;
END;
/

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_refugee_shelter   ON Refugee(Shelter_id);
CREATE INDEX idx_refugee_camp      ON Refugee(Camp_id);
CREATE INDEX idx_refugee_status    ON Refugee(Status);
CREATE INDEX idx_medrec_refugee    ON Medical_Record(Refugee_id);
CREATE INDEX idx_medrec_critical   ON Medical_Record(Is_Critical);
CREATE INDEX idx_inventory_cat     ON Inventory(Category);
CREATE INDEX idx_inventory_low     ON Inventory(Quantity);
CREATE INDEX idx_incident_shelter  ON Incident_Report(Shelter_id);
CREATE INDEX idx_incident_severity ON Incident_Report(Severity);
CREATE INDEX idx_org_name ON Organization(name);

-- ============================================================
-- VIEWS (canned transactions / reports)
-- ============================================================

CREATE OR REPLACE VIEW v_critical_patients AS
SELECT r.Refugee_id, r.name AS Refugee_name, r.Nationality,
       m.Record_id, m.Diagnosis, m.Treatment, m.Record_date,
       d.name AS Doctor_name, d.Specialization, s.Shelter_name
FROM Medical_Record m
JOIN Refugee r ON m.Refugee_id = r.Refugee_id
JOIN Doctor  d ON m.Doctor_id  = d.Doctor_id
JOIN Shelter s ON r.Shelter_id = s.Shelter_id
WHERE m.Is_Critical = 'Y'
ORDER BY m.Record_date DESC;

CREATE OR REPLACE VIEW v_low_stock AS
SELECT i.Product_id, i.Product_name, i.Category,
       i.Quantity, i.Low_alert,
       i.Quantity - i.Low_alert AS Stock_deficit,
       s.Shelter_name, i.Exp_date
FROM Inventory i
JOIN Shelter s ON i.Shelter_id = s.Shelter_id
WHERE i.Quantity <= i.Low_alert
ORDER BY i.Category, i.Quantity;

CREATE OR REPLACE VIEW v_shelter_summary AS
SELECT s.Shelter_id, s.Shelter_name,
       s.Total_capacity, s.Curr_capacity,
       s.Total_capacity - s.Curr_capacity AS Available_space,
       ROUND((s.Curr_capacity / NULLIF(s.Total_capacity,0)) * 100, 1) AS Occupancy_pct,
       s.Critical_patients, c.Coordinator_name
FROM Shelter s
LEFT JOIN Coordinator c ON s.Coordinator_id = c.Coordinator_id;

CREATE OR REPLACE VIEW v_refugee_profile AS
SELECT r.Refugee_id, r.name, r.DOB,
       TRUNC(MONTHS_BETWEEN(SYSDATE, r.DOB)/12) AS Age,
       r.Gender, r.Nationality, r.In_date,
       r.Vulnerability, r.Status, r.Has_Family,
       s.Shelter_name, camp.Camp_name
FROM Refugee r
LEFT JOIN Shelter s    ON r.Shelter_id = s.Shelter_id
LEFT JOIN Camp    camp ON r.Camp_id    = camp.Camp_id;

CREATE OR REPLACE VIEW v_donation_summary AS
SELECT NVL(o.name, md.Donor_name) AS Donor,
       SUM(md.Amount)             AS Total_donated,
       COUNT(*)                   AS Num_donations,
       MAX(md.Donated_date)       AS Last_donation
FROM Monetary_Donations md
LEFT JOIN Organization o ON md.Org_id = o.Org_id
GROUP BY NVL(o.name, md.Donor_name)
ORDER BY Total_donated DESC;

CREATE OR REPLACE VIEW v_incident_summary AS
SELECT i.Incident_id, i.Date_reported, i.Severity, i.Description,
       s.Shelter_name, r.name AS Refugee_name, v.name AS Volunteer_name
FROM Incident_Report i
LEFT JOIN Shelter   s ON i.Shelter_id   = s.Shelter_id
LEFT JOIN Refugee   r ON i.Refugee_id   = r.Refugee_id
LEFT JOIN Volunteer v ON i.Volunteer_id = v.Volunteer_id
ORDER BY i.Date_reported DESC;

CREATE OR REPLACE VIEW v_volunteer_report AS
SELECT v.Volunteer_id, v.name, v.Hours, v.Status,
       s.Shelter_name, o.name AS Organization
FROM Volunteer v
LEFT JOIN Shelter      s ON v.Shelter_id = s.Shelter_id
LEFT JOIN Organization o ON v.Org_id     = o.Org_id
ORDER BY v.Hours DESC;

CREATE OR REPLACE VIEW v_camp_report AS
SELECT c.Camp_id, c.Camp_name, c.Location,
       c.Total_capacity, c.Curr_capacity,
       c.Total_capacity - c.Curr_capacity AS Available,
       ROUND((c.Curr_capacity / NULLIF(c.Total_capacity,0)) * 100, 1) AS Occupancy_pct,
       s.Shelter_name
FROM Camp c
JOIN Shelter s ON c.Shelter_id = s.Shelter_id
ORDER BY Occupancy_pct DESC;

COMMIT;
-- ============================================================
-- Alterations
-- ============================================================

ALTER TABLE Refugee_Family
DROP PRIMARY KEY;
ALTER TABLE Refugee_Family
DROP COLUMN Family_id;
ALTER TABLE Refugee_Family
ADD CONSTRAINT pk_refugee_family
PRIMARY KEY (Refugee_id, Ref_Head_id);

ALTER TABLE SHELTER ADD (
  COUNTRY   VARCHAR2(100),
  STATE     VARCHAR2(100),
  DISTRICT  VARCHAR2(100),
  CITY      VARCHAR2(100),
  LATITUDE  NUMBER,
  LONGITUDE NUMBER
);
ALTER TABLE CAMP RENAME COLUMN LOCATION TO BLOCK;
ALTER TABLE DOCTOR ADD EMAIL VARCHAR(20);
ALTER TABLE DOCTOR ADD CONTACT_NO VARCHAR(11);

ALTER TABLE USERS ADD CONSTRAINT ROLE_CHECK CHECK(ROLE IN ('Volunteer','Doctor','Coordinator','Admin'));
ALTER TABLE USERS ADD CONSTRAINT SINGLE_ROLE_ID CHECK (
  (doctor_id IS NOT NULL AND volunteer_id IS NULL AND coordinator_id IS NULL) OR
  (doctor_id IS NULL AND volunteer_id IS NOT NULL AND coordinator_id IS NULL) OR
  (doctor_id IS NULL AND volunteer_id IS NULL AND coordinator_id IS NOT NULL) OR
  (doctor_id IS NULL AND volunteer_id IS NULL AND coordinator_id IS NULL) -- admin
);
ALTER TABLE USERS ADD CONSTRAINT USERNAME UNIQUE;   
ALTER TABLE USERS ADD EMAIL VARCHAR(50) UNIQUE;


ALTER TABLE AID_DISTRIBUTION MODIFY SHELTER_ID NUMBER NOT NULL;
ALTER TABLE AID_DISTRIBUTION ADD CONSTRAINT FK_KEY FOREIGN KEY (SHELTER_ID) REFERENCES SHELTER (SHELTER_ID);
-- ============================================================
-- STORED PROCEDURES
-- ============================================================

