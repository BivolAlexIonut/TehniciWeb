-- Script creare baza de date, utilizator si tabele pentru proiectul Tehnici Web - Magazin CrossFit
-- Trebuie rulat conectat ca postgres sau un utilizator cu drepturi de creare DB/Role.

-- 1. Creare Utilizator si Baza de Date
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'proiect_user') THEN
      CREATE ROLE proiect_user LOGIN PASSWORD 'proiect_pass';
   END IF;
END
$do$;

-- Nota: Baza de date nu poate fi creata intr-un bloc DO (tranzactie).
-- Din acest motiv, se recomanda executarea manuala daca magazin_crossfit nu exista.
-- CREATE DATABASE magazin_crossfit OWNER proiect_user;
-- GRANT ALL PRIVILEGES ON DATABASE magazin_crossfit TO proiect_user;

-- Dupa ce ai creat si te-ai conectat la magazin_crossfit:

-- 2. Creare tip ENUM pentru categorie
DO $$ BEGIN
    CREATE TYPE categorie_produs AS ENUM ('Echipamente', 'Accesorii', 'Suplimente', 'Imbracaminte', 'Incaltaminte');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Creare tabel Produse
CREATE TABLE IF NOT EXISTS produse (
    id SERIAL PRIMARY KEY,
    nume VARCHAR(255) NOT NULL,
    descriere TEXT NOT NULL,
    imagine VARCHAR(255) NOT NULL,
    categorie categorie_produs NOT NULL,
    tip_livrare VARCHAR(100) NOT NULL,
    pret NUMERIC(10,2) NOT NULL,
    greutate NUMERIC(10,2) NOT NULL,
    data_adaugare DATE NOT NULL,
    culoare VARCHAR(50) NOT NULL,
    materiale VARCHAR(255) NOT NULL,
    pentru_competitii BOOLEAN NOT NULL
);

-- Acordare permisiuni tabel
GRANT ALL PRIVILEGES ON TABLE produse TO proiect_user;
GRANT USAGE, SELECT ON SEQUENCE produse_id_seq TO proiect_user;

-- 4. Creare tabele pentru Seturi (Bonus 17)
CREATE TABLE IF NOT EXISTS seturi (
    id SERIAL PRIMARY KEY,
    nume_set VARCHAR(255) NOT NULL,
    descriere_set TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asociere_set (
    id SERIAL PRIMARY KEY,
    id_set INTEGER REFERENCES seturi(id) ON DELETE CASCADE,
    id_produs INTEGER REFERENCES produse(id) ON DELETE CASCADE
);

GRANT ALL PRIVILEGES ON TABLE seturi TO proiect_user;
GRANT USAGE, SELECT ON SEQUENCE seturi_id_seq TO proiect_user;
GRANT ALL PRIVILEGES ON TABLE asociere_set TO proiect_user;
GRANT USAGE, SELECT ON SEQUENCE asociere_set_id_seq TO proiect_user;

-- 5. Inserare produse (16 entitati cu imagini reale)
TRUNCATE TABLE asociere_set, seturi, produse RESTART IDENTITY;

INSERT INTO produse (nume, descriere, imagine, categorie, tip_livrare, pret, greutate, data_adaugare, culoare, materiale, pentru_competitii) VALUES
('Kettlebell 16kg', 'Kettlebell din fonta pentru antrenamente functionale.', '/resurse/imagini/kettlebell-16kg.png', 'Echipamente', 'Curier', 150.00, 16.00, '2023-01-15', 'Negru', 'Fonta', true),
('Bara Olimpica 20kg', 'Bara olimpica cu rulmenti, incarcare maxima 680kg.', '/resurse/imagini/bara-olimpica-20kg.png', 'Echipamente', 'Curier', 1100.00, 20.00, '2021-06-15', 'Argintiu', 'Otel', true),
('Discuri Bumper 10kg', 'Discuri din cauciuc rezistente la impact.', '/resurse/imagini/disc-bumper-10kg.png', 'Echipamente', 'Curier', 200.00, 10.00, '2021-06-20', 'Negru', 'Cauciuc,Otel', true),
('Magneziu pudra 500g', 'Magneziu carbonat pentru aderenta maxima pe bara.', '/resurse/imagini/creta.png', 'Accesorii', 'Posta', 35.00, 0.50, '2022-04-18', 'Alb', 'Carbonat de magneziu', true),
('Cutie pliometrica lemn', 'Cutie din lemn 3-in-1 (20" 24" 30") pentru sarituri.', '/resurse/imagini/cutie-pliometrica.png', 'Echipamente', 'Ridicare', 350.00, 22.00, '2022-09-01', 'Maro', 'Lemn', false),
('Assault AirBike', 'Bicicleta de asalt cu rezistenta pe aer, ideala pentru antrenamente HIIT si metcon-uri intense.', '/resurse/imagini/assault-bike-c2.png', 'Echipamente', 'Curier', 4500.00, 57.00, '2025-03-10', 'Negru', 'Otel,Plastic,Cauciuc', true),
('BikeErg Concept2', 'Bicicleta stationara Concept2 cu rezistenta pe aer si monitor PM5 integrat.', '/resurse/imagini/bikeerg-c2.png', 'Echipamente', 'Curier', 5200.00, 42.00, '2025-01-15', 'Negru', 'Otel,Aluminiu,Plastic', true),
('Centura Dip Belt', 'Centura pentru atasat greutati la exercitii de dips, pull-ups si alte miscari cu greutatea corpului.', '/resurse/imagini/centura-atarnat-greutati.png', 'Accesorii', 'Posta', 120.00, 0.45, '2025-05-01', 'Negru', 'Nylon,Otel,Lant', true),
('Creta Lichida 250ml', 'Creta lichida pentru aderenta maxima pe bara, se usuca rapid si nu face mizerie.', '/resurse/imagini/creta-lichida.png', 'Accesorii', 'Posta', 55.00, 0.25, '2025-04-12', 'Negru', 'Carbonat de magneziu,Alcool', false),
('Inele Gimnastica Lemn', 'Set inele de gimnastica din lemn cu chingi ajustabile, ideale pentru muscle-ups si dips.', '/resurse/imagini/inele-gimnastica-set.png', 'Echipamente', 'Curier', 280.00, 1.50, '2025-02-20', 'Maro', 'Lemn,Nylon', true),
('Rower Concept2 Model D', 'Aparat de vaslit Concept2 cu monitor PM5, rezistenta pe aer reglabila.', '/resurse/imagini/row-c2.png', 'Echipamente', 'Curier', 6500.00, 26.00, '2024-11-05', 'Negru', 'Otel,Aluminiu,Plastic', true),
('Set Discuri Bumper Olimpice', 'Set complet discuri bumper olimpice (5-25kg), cauciuc rezistent la impact.', '/resurse/imagini/set-discuri-bumper.png', 'Echipamente', 'Curier', 2800.00, 80.00, '2024-08-15', 'Negru', 'Cauciuc,Otel', true),
('SkiErg Concept2', 'Simulator de schi Concept2 cu monitor PM5, antrenament complet pentru partea superioara.', '/resurse/imagini/skierg-c2.png', 'Echipamente', 'Curier', 5800.00, 21.00, '2025-06-01', 'Negru', 'Otel,Aluminiu,Plastic', true),
('Wall Ball 4kg', 'Minge medicinala de 4kg pentru wall balls, cusuta manual, umplutura moale.', '/resurse/imagini/wallball-4kg.png', 'Echipamente', 'Curier', 85.00, 4.00, '2025-07-10', 'Negru', 'Piele sintetica,Nisip', false),
('Wall Ball 9kg', 'Minge medicinala de 9kg pentru wall balls, dimensiuni reglementate competitie.', '/resurse/imagini/wallball-9kg.png', 'Echipamente', 'Curier', 120.00, 9.00, '2025-07-10', 'Gri', 'Piele sintetica,Nisip', true),
('Palmare CrossFit', 'Palmare de protectie pentru CrossFit cu 3 gauri, previn bataturile la tractiuni si muscle-ups.', '/resurse/imagini/palmare-crossfit.png', 'Accesorii', 'Posta', 95.00, 0.08, '2025-08-01', 'Negru', 'Carbon,Piele,Nylon', true),
('Ashwagandha 500mg', 'Supliment pe baza de plante pentru reducerea stresului si recuperare.', '/resurse/imagini/ashwagandha.png', 'Suplimente', 'Curier', 45.00, 0.10, '2023-10-01', 'Alb', 'Extract de Ashwagandha', false),
('Beta-Alanina 300g', 'Supliment pre-workout pentru cresterea rezistentei musculare.', '/resurse/imagini/beta-alanine-supplement.png', 'Suplimente', 'Curier', 65.00, 0.30, '2023-09-15', 'Alb', 'Beta-Alanina pura', false),
('Pantaloni scurti CrossFit', 'Pantaloni scurti usori, elastici, perfecti pentru mobilitate in WOD-uri.', '/resurse/imagini/crossfit-pants.png', 'Imbracaminte', 'Curier', 120.00, 0.20, '2023-08-20', 'Negru', 'Poliester,Elastan', false),
('Set Haltere Olimpice', 'Haltere cu greutati interschimbabile, standard olimpic.', '/resurse/imagini/haltere-olimpice.png', 'Echipamente', 'Curier', 850.00, 50.00, '2022-11-10', 'Argintiu', 'Otel', true),
('Supliment Fier 30 tablete', 'Sustine formarea normala a globulelor rosii si a hemoglobinei.', '/resurse/imagini/iron-supplement.png', 'Suplimente', 'Posta', 30.00, 0.05, '2023-05-05', 'Alb', 'Fier', false),
('Coarda de sarit Viteza', 'Coarda de viteza ajustabila pentru double unders perfecte.', '/resurse/imagini/jumping-rope.jpg', 'Accesorii', 'Posta', 45.00, 0.15, '2023-03-25', 'Negru', 'Cablu otel,Plastic', true),
('Magneziu + B6', 'Sustine functionarea normala a sistemului nervos si muscular.', '/resurse/imagini/magnesium.png', 'Suplimente', 'Posta', 40.00, 0.05, '2023-04-12', 'Alb', 'Magneziu', false),
('Incaltaminte Nike Romaleos', 'Pantofi de haltere ofera stabilitate maxima in timpul ridicarilor.', '/resurse/imagini/nike-squa-shoes romaleos.png', 'Incaltaminte', 'Curier', 950.00, 1.20, '2023-02-18', 'Alb,Negru', 'Piele sintetica,Cauciuc,TPU', true),
('Omega 3 Ulei de Peste', 'Supliment cu acizi grasi esentiali pentru sanatatea inimii si articulatiilor.', '/resurse/imagini/omega3.png', 'Suplimente', 'Curier', 55.00, 0.10, '2023-01-10', 'Galben', 'Ulei de peste', false),
('Incaltaminte Reebok Nano X', 'Pantofi versatili pentru alergare, ridicari si WOD-uri intense.', '/resurse/imagini/reebook-crossfit-shoes.png', 'Incaltaminte', 'Curier', 550.00, 0.80, '2022-07-22', 'Negru,Rosu', 'Textil,Cauciuc', true),
('Tricou CrossFit', 'Tricou respirabil pentru confort sporit in timpul antrenamentului.', '/resurse/imagini/tricou-crossfit.png', 'Imbracaminte', 'Posta', 85.00, 0.15, '2023-06-30', 'Gri', 'Bumbac,Poliester', false),
('Incaltaminte TYR CXT-1', 'Stabilitate exceptionala si suport pentru ridicari si antrenamente functionale.', '/resurse/imagini/tyr-crossfit-shoes.png', 'Incaltaminte', 'Curier', 680.00, 0.85, '2023-08-05', 'Albastru', 'Nylon,Cauciuc', true),
('Incaltaminte U-Form', 'Model customizabil prin incalzire pentru a se mula perfect pe picior.', '/resurse/imagini/u-form-crossfit-shoes.png', 'Incaltaminte', 'Curier', 600.00, 0.90, '2022-10-14', 'Negru', 'Sintetic,Cauciuc', true),
('Incaltaminte Velites', 'Usori si rezistenti, perfecti pentru viteza in WOD-uri de metcon.', '/resurse/imagini/velites-crossfit-shoes.png', 'Incaltaminte', 'Curier', 520.00, 0.75, '2023-05-18', 'Verde', 'Textil,Cauciuc', false),
('Vitamina K2 100mcg', 'Sustine metabolismul osos si sanatea cardiovasculara.', '/resurse/imagini/vitamin-k2.png', 'Suplimente', 'Posta', 35.00, 0.05, '2023-11-20', 'Alb', 'Vitamina K2', false);

-- 6. Inserare seturi si asocieri (Bonus 17)
INSERT INTO seturi (nume_set, descriere_set) VALUES
('Pachet Cardio Complet', 'Assault AirBike si Rower Concept2 pentru antrenamente cardio variate.'),
('Pachet Concept2 Ultimate', 'BikeErg, Rower si SkiErg Concept2 pentru sala completa.'),
('Pachet Forta Incepatori', 'Bara olimpica, disc bumper si kettlebell pentru inceput.'),
('Pachet Wall Ball', 'Wall Ball 4kg si 9kg pentru antrenamente la diferite intensitati.'),
('Pachet Accesorii Grip', 'Creta, creta lichida si palmare pentru grip maxim pe bara.');

-- Pachet Cardio Complet (Assault AirBike = 6, Rower = 11)
INSERT INTO asociere_set (id_set, id_produs) VALUES (1, 6), (1, 11);

-- Pachet Concept2 Ultimate (BikeErg = 7, Rower = 11, SkiErg = 13)
INSERT INTO asociere_set (id_set, id_produs) VALUES (2, 7), (2, 11), (2, 13);

-- Pachet Forta Incepatori (Bara = 2, Disc = 3, Kettlebell = 1)
INSERT INTO asociere_set (id_set, id_produs) VALUES (3, 2), (3, 3), (3, 1);

-- Pachet Wall Ball (4kg = 14, 9kg = 15)
INSERT INTO asociere_set (id_set, id_produs) VALUES (4, 14), (4, 15);

-- Pachet Accesorii Grip (Magneziu = 4, Creta Lichida = 9, Palmare = 16)
INSERT INTO asociere_set (id_set, id_produs) VALUES (5, 4), (5, 9), (5, 16);
