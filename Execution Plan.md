# WAPREP Campus Brawl: Club Meeting Execution Plan



UNDER CONSTRUCTION


# I. GitHub Setup & Tutorial (15 min)

**Goal:** Establish the **“Home Base”** for all code and assets.

### Tools

- Everyone must install **GitHub Desktop**?? (Maybe just use vscode, probably)

### Live Demo

1. Show **Cloning**
    
2. Demonstrate the workflow:
    - Create a `.txt` file
    - **Commit** (write a note)        
    - **Push** (upload)
### Collaboration Rules

Emphasize the golden rule:

> **Pull before you start, Push when you’re done.**

This applies to **everyone** — even artists uploading images.

---

# II. Gameplay & Mechanics (Core Mechanics)

## A. Phase One — Extreme Stacking (Construction Phase)

### Placement

- A horizontal **“claw”** (like a crane game) moves back and forth at the top.
    
- The classroom block swings from it.
    
- Players **tap the screen to drop the block**.
    

### Physical Variables

- **Mass**
    
    - Science Labs are heavier than normal classrooms.
        
    - They might **crush or stabilize** lower blocks.
        
- **Friction**
    
    - Playground blocks are slippery.
        
    - Classrooms dropped on them might **slide off the edge**.
        
- **Bounciness**
    
    - The Music Room or Gym acts like a **trampoline**, causing chaos upon impact.

---

## B. Phase Two — Precision Demolition (Destruction Phase)

### Launching

- A **slingshot** appears on the left.
    
- Players pull back to fire **“Student Heads.”**
    

### Ammo Logic

- Ammo is **not infinite**.
    
- The higher the stack in Phase One, the **more ammo you earn**.
    

Possible mechanic:

- Ammo may have **special abilities**
    
    - Example: **Explosion**
        

### Objective

Destroy **your own creation**.

---

## C. Environmental & Rule Details

### Time Limit

- Phase One has a **configurable countdown timer**.
    
- When time expires, the **claw disappears**.
    

### Seattle Rain (Random Event) (?)

- Screen dims and **rain starts falling**.
    
- **Surface friction is halved**, making everything slippery.
    
    

---

# III. Creative Design (The Gags)

Traits that **club members can claim and develop**.

---

## Classroom (Object) Attributes (Examples.)

- **Cafeteria**
    
    - _“Sticky Block”_
        
    - Adheres to other blocks, stabilizing the stack.
        
- **Science Room**
    
    - High **explosive potential**
        
    - If hit hard, it damages surrounding blocks
        

---

## Character (Ammo) Skills

- To be worked on.
    

---

### 3. Mobile Web

**Instant Access**

For a **5-minute showcase**, a **QR code that opens a browser** is ideal.

Advantages:

- Touchscreen dragging
    
- Touchscreen tapping
    
- More immersive than mouse clicks
    

---

# V. Group Assignments (Job List)

---

## 1. Core Physics & Logic

**Task**

Configure object properties in **Matter.js**

Example:

```
Science Lab Density = 2.0
```

**Coding Tasks**

- Write the **Claw Swing function**
    
- Implement **Slingshot trajectory math**
    

Create a **Fracture System**:

If

```
Force > Threshold
```

then the block breaks into **4 smaller debris pieces**.

---

## 2. Narrative & Balancing

Maintain a **spreadsheet of all stats**.

Example:

```
Kai Damage = 50
```

---

## 3. Asset Hunting & Audio

### Photography

- Capture **school buildings**
    
- Extract **color palettes and background references**
    

### Audio Editing

- Sounds must be **< 1 second**
    
- File formats:
    
    - `.mp3`
        
    - `.ogg`
        

### Sound

- **Mr. David**
    

---

## 4. UI / UX Design

### Layout

- Large **Launch button** for thumbs
    
- **GPA Bar** at the top to track stack height
    

### Visual Feedback

Design **combo popups**

Examples:

- **Excellent!**
    
- **Total Collapse!**
    

---

## 5. Art & Sprites

### Processing

- Convert classroom photos into **transparent `.png` sprites**
    
- Apply consistent art style
    
    - thick outlines
        
    - pixel style
        

### Animation

Create frames for:

- **Student Head rotation**
    
- **Explosion**
    
- **Smoke effects**
    

---

## 6. Frontend & Deployment

### Integration

Merge:

- art assets
    
- physics engine
    

into the main **Phaser scene**.

### GitHub

- Resolve **merge conflicts**
    

### Hosting

Deploy using **GitHub Pages**

Result:

- QR code works on **any phone browser**
    

---

## 7. Level & Environment

### Ground Design

Create floor shapes:

- slopes
    
- stairs
    
- moving platforms
    

### Parallax Background

Use **near and distant school layers** to create **2D depth**.
