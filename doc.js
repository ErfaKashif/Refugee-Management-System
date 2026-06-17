const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak
} = require('docx');
const fs = require('fs');

// ── helpers ──────────────────────────────────────────────────────────────────
const W = 9360; // content width DXA
const b = (c="CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const borders = (c="CCCCCC") => ({ top:b(c), bottom:b(c), left:b(c), right:b(c) });
const cell = (children, w, fill="FFFFFF", bold=false, color="000000") =>
  new TableCell({
    borders: borders("CCCCCC"),
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top:80, bottom:80, left:120, right:120 },
    width: { size:w, type:WidthType.DXA },
    children: Array.isArray(children) ? children : [
      new Paragraph({ children:[new TextRun({ text:children, size:20, font:"Courier New", bold, color })] })
    ]
  });

const hcell = (text, w) => cell(text, w, "1F4E79", true, "FFFFFF");
const shade1 = (text, w) => cell(text, w, "EAF2FF", true, "1F4E79");
const shade2 = (text, w) => cell(text, w, "F5F5F5");

const sp = (before=0,after=0) => ({ before, after });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children:[new TextRun({ text, bold:true, size:32, font:"Arial", color:"1F4E79" })],
  spacing: sp(360,120),
  border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:"1F4E79", space:1 } }
});
const h2 = (text, color="2E75B6") => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children:[new TextRun({ text, bold:true, size:26, font:"Arial", color })],
  spacing: sp(280,80)
});
const h3 = (text) => new Paragraph({
  children:[new TextRun({ text, bold:true, size:23, font:"Arial", color:"404040" })],
  spacing: sp(200,60)
});
const p = (text, size=22) => new Paragraph({
  children:[new TextRun({ text, size, font:"Arial" })],
  spacing: sp(40,40)
});
const gap = (n=1) => Array(n).fill(new Paragraph({ children:[new TextRun("")], spacing:sp(60,60) }));

// code block — monospace lines
const codeBlock = (lines, bgColor="1E1E1E") => {
  const rows = lines.map(line =>
    new TableRow({ children:[
      new TableCell({
        borders: borders("333333"),
        shading:{ fill:bgColor, type:ShadingType.CLEAR },
        margins:{ top:40, bottom:40, left:200, right:200 },
        width:{ size:W, type:WidthType.DXA },
        children:[new Paragraph({ children:[new TextRun({ text:line, size:18, font:"Courier New", color:"D4D4D4" })] })]
      })
    ]})
  );
  return new Table({ width:{ size:W, type:WidthType.DXA }, columnWidths:[W], rows });
};

// comparison table helper
const compTable = (headers, colWidths, rows, headerFill="1F4E79") =>
  new Table({
    width:{ size:W, type:WidthType.DXA },
    columnWidths: colWidths,
    rows:[
      new TableRow({ children: headers.map((h,i) => hcell(h, colWidths[i])) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((c,i) =>
        new TableCell({
          borders: borders("CCCCCC"),
          shading:{ fill: ri%2===0?"FFFFFF":"F7FAFF", type:ShadingType.CLEAR },
          margins:{ top:80, bottom:80, left:120, right:120 },
          width:{ size:colWidths[i], type:WidthType.DXA },
          children:[new Paragraph({ children:[new TextRun({ text:c, size:20, font:"Arial" })] })]
        })
      )}))
    ]
  });

// ── CONTENT ──────────────────────────────────────────────────────────────────

// ---- IPC COMPARISON TABLE ----
const ipcComparison = [
  ["Feature",         "Pipes",              "Named Pipes (FIFO)",    "Shared Memory",         "Message Queue"],
  ["Communication",   "Unidirectional",     "Uni or Bidirectional",  "Bidirectional",         "Bidirectional"],
  ["Persistence",     "None (process life)","Exists in filesystem",  "Until deleted",         "Until deleted"],
  ["Related procs",   "Related only",       "Unrelated allowed",     "Any process",           "Any process"],
  ["Speed",           "Moderate",           "Moderate",              "Fastest (no copy)",     "Moderate"],
  ["Sync needed",     "Built-in",           "Built-in",              "Manual (semaphore)",    "Built-in"],
  ["Data type",       "Byte stream",        "Byte stream",           "Raw memory",            "Typed messages"],
  ["Kernel copy",     "Yes (2 copies)",     "Yes (2 copies)",        "No copy",               "Yes (2 copies)"],
  ["Use case",        "Parent-child",       "Shell pipelines",       "Large data sharing",    "Async messaging"],
  ["Bidirectional?",  "Need 2 pipes",       "Need 2 FIFOs or O_RDWR","Yes, naturally",        "Separate queues"],
];

const ipcTable = compTable(
  ipcComparison[0],
  [1600,1900,1900,1980,1980],
  ipcComparison.slice(1)
);

// ---- UNI/BIDI TABLE ----
const unibiTable = compTable(
  ["IPC Type","Unidirectional","Bidirectional","How to achieve Bidirectional"],
  [2000,1600,1600,4160],
  [
    ["Pipes",         "Native",  "Possible",  "Create 2 pipes: pipe1 parent→child, pipe2 child→parent"],
    ["Named Pipes",   "Native",  "Possible",  "Create 2 FIFOs or open one FIFO O_RDWR on Linux"],
    ["Shared Memory", "N/A",     "Native",    "Both processes read/write same memory region freely"],
    ["Message Queue", "Possible","Native",    "Each direction uses different message type (mtype)"],
  ]
);

// ═══════════ C CODE STRINGS ═══════════

const pipesUniCode = [
  "// PIPES — Unidirectional (Parent writes, Child reads)",
  "#include <stdio.h>",
  "#include <unistd.h>",
  "#include <string.h>",
  "",
  "int main() {",
  "    int fd[2];          // fd[0]=read end, fd[1]=write end",
  "    pipe(fd);",
  "",
  "    if (fork() == 0) { // CHILD",
  "        close(fd[1]);  // close unused write end",
  "        char buf[50];",
  "        read(fd[0], buf, sizeof(buf));",
  "        printf(\"Child received: %s\\n\", buf);",
  "        close(fd[0]);",
  "    } else {            // PARENT",
  "        close(fd[0]);  // close unused read end",
  "        char *msg = \"Hello from parent!\";",
  "        write(fd[1], msg, strlen(msg)+1);",
  "        close(fd[1]);",
  "    }",
  "    return 0;",
  "}",
];

const pipesBidiCode = [
  "// PIPES — Bidirectional (2 pipes)",
  "#include <stdio.h>",
  "#include <unistd.h>",
  "#include <string.h>",
  "",
  "int main() {",
  "    int p1[2], p2[2]; // p1: parent→child, p2: child→parent",
  "    pipe(p1); pipe(p2);",
  "",
  "    if (fork() == 0) {  // CHILD",
  "        close(p1[1]); close(p2[0]);",
  "        char buf[50];",
  "        read(p1[0], buf, sizeof(buf));",
  "        printf(\"Child got: %s\\n\", buf);",
  "        write(p2[1], \"Reply from child\", 17);",
  "        close(p1[0]); close(p2[1]);",
  "    } else {             // PARENT",
  "        close(p1[0]); close(p2[1]);",
  "        write(p1[1], \"Hello child\", 12);",
  "        char buf[50];",
  "        read(p2[0], buf, sizeof(buf));",
  "        printf(\"Parent got: %s\\n\", buf);",
  "        close(p1[1]); close(p2[0]);",
  "    }",
  "    return 0;",
  "}",
];

const namedPipeCode = [
  "// NAMED PIPES — Writer process",
  "#include <stdio.h>",
  "#include <fcntl.h>",
  "#include <sys/stat.h>",
  "#include <unistd.h>",
  "",
  "int main() {",
  "    mkfifo(\"/tmp/myfifo\", 0666);   // create named pipe in filesystem",
  "    int fd = open(\"/tmp/myfifo\", O_WRONLY);",
  "    write(fd, \"Message via FIFO\", 17);",
  "    close(fd);",
  "    return 0;",
  "}",
  "",
  "// NAMED PIPES — Reader process (separate program)",
  "int main() {",
  "    int fd = open(\"/tmp/myfifo\", O_RDONLY);",
  "    char buf[50];",
  "    read(fd, buf, sizeof(buf));",
  "    printf(\"Received: %s\\n\", buf);",
  "    close(fd);",
  "    unlink(\"/tmp/myfifo\"); // delete FIFO from filesystem",
  "    return 0;",
  "}",
];

const shmCode = [
  "// SHARED MEMORY — Process A (writer)",
  "#include <stdio.h>",
  "#include <sys/shm.h>",
  "#include <string.h>",
  "",
  "int main() {",
  "    key_t key = ftok(\"shm_file\", 65);          // unique key",
  "    int shmid = shmget(key, 1024, 0666|IPC_CREAT); // create segment",
  "    char *shm = (char*) shmat(shmid, NULL, 0);  // attach to address space",
  "",
  "    strcpy(shm, \"Data written to shared memory\");",
  "    printf(\"Writer: data written\\n\");",
  "",
  "    shmdt(shm);                                 // detach",
  "    return 0;",
  "}",
  "",
  "// SHARED MEMORY — Process B (reader)",
  "int main() {",
  "    key_t key = ftok(\"shm_file\", 65);",
  "    int shmid = shmget(key, 1024, 0666);",
  "    char *shm = (char*) shmat(shmid, NULL, 0);",
  "",
  "    printf(\"Reader: %s\\n\", shm);",
  "",
  "    shmdt(shm);",
  "    shmctl(shmid, IPC_RMID, NULL);             // destroy segment",
  "    return 0;",
  "}",
];

const msgQueueCode = [
  "// MESSAGE QUEUE — Sender",
  "#include <stdio.h>",
  "#include <sys/msg.h>",
  "#include <string.h>",
  "",
  "struct msgbuf { long mtype; char mtext[100]; };",
  "",
  "int main() {",
  "    key_t key = ftok(\"msg_file\", 65);",
  "    int msgid = msgget(key, 0666|IPC_CREAT);",
  "",
  "    struct msgbuf msg;",
  "    msg.mtype = 1;                           // message type = 1",
  "    strcpy(msg.mtext, \"Hello via message queue\");",
  "    msgsnd(msgid, &msg, sizeof(msg.mtext), 0);",
  "    printf(\"Message sent\\n\");",
  "    return 0;",
  "}",
  "",
  "// MESSAGE QUEUE — Receiver",
  "int main() {",
  "    key_t key = ftok(\"msg_file\", 65);",
  "    int msgid = msgget(key, 0666);",
  "",
  "    struct msgbuf msg;",
  "    msgrcv(msgid, &msg, sizeof(msg.mtext), 1, 0); // receive type=1",
  "    printf(\"Received: %s\\n\", msg.mtext);",
  "",
  "    msgctl(msgid, IPC_RMID, NULL);           // destroy queue",
  "    return 0;",
  "}",
];

// ══ PRODUCER CONSUMER ══

const pcDesc = [
  "PRODUCER CONSUMER PROBLEM",
  "─────────────────────────",
  "Problem: Producer generates data items and places them in a shared",
  "         bounded buffer. Consumer removes and processes items.",
  "",
  "Constraints:",
  "  1. Producer must not add to a FULL buffer  (wait if full)",
  "  2. Consumer must not remove from EMPTY buffer (wait if empty)",
  "  3. Only one process accesses buffer at a time (mutual exclusion)",
  "",
  "Solution uses 3 semaphores:",
  "  mutex  = 1   (binary semaphore for mutual exclusion)",
  "  empty  = N   (counting semaphore, N = buffer size)",
  "  full   = 0   (counting semaphore)",
];

const pcCode = [
  "// PRODUCER CONSUMER — Shared Memory + Semaphores (POSIX)",
  "#include <stdio.h>",
  "#include <stdlib.h>",
  "#include <pthread.h>",
  "#include <semaphore.h>",
  "",
  "#define BUFFER_SIZE 5",
  "#define ITEMS       10",
  "",
  "int buffer[BUFFER_SIZE];",
  "int in = 0, out = 0;          // in=next empty slot, out=next full slot",
  "",
  "sem_t mutex;                   // mutual exclusion",
  "sem_t empty;                   // counts empty slots (init = BUFFER_SIZE)",
  "sem_t full;                    // counts full  slots (init = 0)",
  "",
  "void *producer(void *arg) {",
  "    for (int i = 0; i < ITEMS; i++) {",
  "        int item = rand() % 100;   // produce item",
  "",
  "        sem_wait(&empty);          // wait if buffer full",
  "        sem_wait(&mutex);          // enter critical section",
  "",
  "        buffer[in] = item;",
  "        in = (in + 1) % BUFFER_SIZE;",
  "        printf(\"Produced: %d\\n\", item);",
  "",
  "        sem_post(&mutex);          // exit critical section",
  "        sem_post(&full);           // signal one more full slot",
  "    }",
  "    return NULL;",
  "}",
  "",
  "void *consumer(void *arg) {",
  "    for (int i = 0; i < ITEMS; i++) {",
  "        sem_wait(&full);           // wait if buffer empty",
  "        sem_wait(&mutex);          // enter critical section",
  "",
  "        int item = buffer[out];",
  "        out = (out + 1) % BUFFER_SIZE;",
  "        printf(\"Consumed: %d\\n\", item);",
  "",
  "        sem_post(&mutex);          // exit critical section",
  "        sem_post(&empty);          // signal one more empty slot",
  "    }",
  "    return NULL;",
  "}",
  "",
  "int main() {",
  "    pthread_t prod, cons;",
  "",
  "    sem_init(&mutex, 0, 1);            // mutex starts at 1",
  "    sem_init(&empty, 0, BUFFER_SIZE);  // all slots empty initially",
  "    sem_init(&full,  0, 0);            // no full slots initially",
  "",
  "    pthread_create(&prod, NULL, producer, NULL);",
  "    pthread_create(&cons, NULL, consumer, NULL);",
  "",
  "    pthread_join(prod, NULL);",
  "    pthread_join(cons, NULL);",
  "",
  "    sem_destroy(&mutex);",
  "    sem_destroy(&empty);",
  "    sem_destroy(&full);",
  "    return 0;",
  "}",
];

// ══ THREAD SYNC ══

const mutexCode = [
  "// MUTEX — Thread Synchronization",
  "#include <stdio.h>",
  "#include <pthread.h>",
  "",
  "#define THREADS  4",
  "#define ITER     100000",
  "",
  "int counter = 0;               // shared resource",
  "pthread_mutex_t lock;          // mutex lock",
  "",
  "// Worker function — each thread increments counter",
  "void *worker(void *arg) {",
  "    int id = *(int*)arg;",
  "    for (int i = 0; i < ITER; i++) {",
  "        pthread_mutex_lock(&lock);    // ACQUIRE lock",
  "        // ── critical section start ──",
  "        counter++;                    // safe: only one thread here",
  "        // ── critical section end ──",
  "        pthread_mutex_unlock(&lock);  // RELEASE lock",
  "    }",
  "    printf(\"Thread %d done\\n\", id);",
  "    return NULL;",
  "}",
  "",
  "int main() {",
  "    pthread_t threads[THREADS];",
  "    int ids[THREADS];",
  "",
  "    pthread_mutex_init(&lock, NULL);  // initialize mutex",
  "",
  "    for (int i = 0; i < THREADS; i++) {",
  "        ids[i] = i;",
  "        pthread_create(&threads[i], NULL, worker, &ids[i]);",
  "    }",
  "    for (int i = 0; i < THREADS; i++)",
  "        pthread_join(threads[i], NULL);",
  "",
  "    pthread_mutex_destroy(&lock);",
  "    printf(\"Final counter: %d (expected %d)\\n\",",
  "           counter, THREADS * ITER);",
  "    return 0;",
  "}",
];

const semCode = [
  "// SEMAPHORE — Thread Synchronization",
  "#include <stdio.h>",
  "#include <pthread.h>",
  "#include <semaphore.h>",
  "",
  "#define THREADS  3",
  "",
  "sem_t sem;                      // counting semaphore",
  "",
  "// Worker function — controlled access to shared resource",
  "void *worker(void *arg) {",
  "    int id = *(int*)arg;",
  "",
  "    printf(\"Thread %d: waiting to enter\\n\", id);",
  "    sem_wait(&sem);             // P() — decrement, block if 0",
  "",
  "    // ── critical section ──",
  "    printf(\"Thread %d: inside critical section\\n\", id);",
  "    sleep(1);                   // simulate work",
  "    printf(\"Thread %d: leaving\\n\", id);",
  "    // ── end critical section ──",
  "",
  "    sem_post(&sem);             // V() — increment, wake waiting thread",
  "    return NULL;",
  "}",
  "",
  "int main() {",
  "    pthread_t threads[THREADS];",
  "    int ids[THREADS];",
  "",
  "    sem_init(&sem, 0, 2);       // allow max 2 threads at once",
  "",
  "    for (int i = 0; i < THREADS; i++) {",
  "        ids[i] = i;",
  "        pthread_create(&threads[i], NULL, worker, &ids[i]);",
  "    }",
  "    for (int i = 0; i < THREADS; i++)",
  "        pthread_join(threads[i], NULL);",
  "",
  "    sem_destroy(&sem);",
  "    printf(\"All threads finished\\n\");",
  "    return 0;",
  "}",
];

// mutex vs semaphore comparison
const syncCompTable = compTable(
  ["Property","Mutex","Semaphore"],
  [2400,3480,3480],
  [
    ["Type",            "Binary (locked / unlocked)",     "Binary or Counting"],
    ["Value range",     "0 or 1 only",                    "0 to N (any non-negative integer)"],
    ["Ownership",       "Thread that locks must unlock",  "Any thread can signal (post)"],
    ["Purpose",         "Mutual exclusion only",          "Mutual exclusion + signaling"],
    ["Used for",        "Protecting shared data/code",    "Controlling resource count"],
    ["Operations",      "lock() / unlock()",              "wait() P() / signal() V()"],
    ["Init value",      "1 (unlocked)",                   "N (number of resources)"],
    ["Deadlock risk",   "Yes if lock order not managed",  "Yes if wait/post not balanced"],
    ["Priority inversion","Can occur",                    "Can occur"],
    ["Example use",     "Protect counter increment",      "Bound buffer, thread limiting"],
  ]
);

// worker function explanation table
const workerTable = compTable(
  ["Component","In Mutex code","In Semaphore code"],
  [2400,3480,3480],
  [
    ["Function name",   "worker(void *arg)",              "worker(void *arg)"],
    ["Argument",        "Thread ID (int*)",               "Thread ID (int*)"],
    ["Entry control",   "pthread_mutex_lock(&lock)",      "sem_wait(&sem)"],
    ["Critical section","counter++ only",                 "sleep(1) simulating work"],
    ["Exit control",    "pthread_mutex_unlock(&lock)",    "sem_post(&sem)"],
    ["Return",          "NULL",                           "NULL"],
    ["Purpose",         "Each thread adds ITER to counter","Each thread enters, works, exits"],
  ]
);

// ═══════════ BUILD DOCUMENT ═══════════

const doc = new Document({
  numbering: { config: [
    { reference:"bullets", levels:[{ level:0, format:LevelFormat.BULLET, text:"•", alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{ left:720, hanging:360 } } } }] }
  ]},
  styles: {
    default:{ document:{ run:{ font:"Arial", size:22 } } },
    paragraphStyles:[
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:32, bold:true, font:"Arial", color:"1F4E79" },
        paragraph:{ spacing:{ before:360, after:120 }, outlineLevel:0 } },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:26, bold:true, font:"Arial", color:"2E75B6" },
        paragraph:{ spacing:{ before:240, after:80 }, outlineLevel:1 } },
    ]
  },
  sections:[{
    properties:{ page:{ size:{ width:12240, height:15840 }, margin:{ top:1080, right:1080, bottom:1080, left:1080 } } },
    children:[
      // ── TITLE ──
      new Paragraph({
        children:[new TextRun({ text:"IPC & Thread Synchronization", bold:true, size:52, font:"Arial", color:"1F4E79" })],
        alignment:AlignmentType.CENTER, spacing:sp(0,80)
      }),
      new Paragraph({
        children:[new TextRun({ text:"Inter-Process Communication  |  Producer Consumer  |  Mutex & Semaphore", size:24, font:"Arial", color:"2E75B6" })],
        alignment:AlignmentType.CENTER, spacing:sp(0,40)
      }),
      new Paragraph({
        children:[new TextRun({ text:"Pipes  •  Named Pipes  •  Shared Memory  •  Message Queues  •  Thread Sync", size:20, font:"Arial", color:"808080" })],
        alignment:AlignmentType.CENTER, spacing:sp(0,360),
        border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:"1F4E79", space:1 } }
      }),

      // ══════ SECTION 1 — IPC COMPARISON ══════
      h1("1.  IPC Mechanisms — Full Comparison"),
      ...gap(1),
      ipcTable,
      ...gap(2),

      // ── Uni / Bidi table ──
      h2("1.1  Unidirectional vs Bidirectional"),
      ...gap(1),
      unibiTable,
      ...gap(2),

      // ══════ SECTION 2 — PIPES ══════
      h1("2.  Pipes"),
      p("A pipe is a unidirectional byte-stream channel created in kernel memory. It has two file descriptors: fd[0] for reading and fd[1] for writing. Communication flows in one direction only. To achieve bidirectional communication two separate pipes must be created."),
      ...gap(1),
      h2("2.1  Unidirectional — Parent writes, Child reads"),
      ...gap(1),
      codeBlock(pipesUniCode),
      ...gap(2),
      h2("2.2  Bidirectional — Two pipes"),
      ...gap(1),
      codeBlock(pipesBidiCode),
      ...gap(2),

      // ══════ SECTION 3 — NAMED PIPES ══════
      h1("3.  Named Pipes (FIFOs)"),
      p("Named pipes exist as a special file in the filesystem and allow communication between unrelated processes. Unlike anonymous pipes they persist beyond the lifetime of either process. Any process that knows the FIFO path can open it for reading or writing."),
      ...gap(1),
      h2("3.1  Writer and Reader (separate processes)"),
      ...gap(1),
      codeBlock(namedPipeCode),
      ...gap(2),

      // ══════ SECTION 4 — SHARED MEMORY ══════
      h1("4.  Shared Memory"),
      p("Shared memory is the fastest IPC mechanism because data is not copied between processes — both processes map the same physical pages into their address spaces. However, synchronization must be provided externally using semaphores or mutexes to prevent race conditions."),
      ...gap(1),
      h2("4.1  Writer and Reader (System V shared memory)"),
      ...gap(1),
      codeBlock(shmCode),
      ...gap(2),

      // ══════ SECTION 5 — MESSAGE QUEUE ══════
      h1("5.  Message Queue"),
      p("Message queues allow processes to exchange discrete typed messages. Messages are stored in the kernel until received. Unlike pipes, message queues preserve message boundaries and support selective retrieval by message type, enabling natural bidirectional communication."),
      ...gap(1),
      h2("5.1  Sender and Receiver"),
      ...gap(1),
      codeBlock(msgQueueCode),
      ...gap(2),

      // ══════ SECTION 6 — PRODUCER CONSUMER ══════
      new Paragraph({ children:[new PageBreak()] }),
      h1("6.  Producer Consumer Problem"),
      ...gap(1),
      codeBlock(pcDesc, "0D2137"),
      ...gap(1),
      h2("6.1  Solution — Bounded Buffer with POSIX Semaphores"),
      ...gap(1),
      codeBlock(pcCode),
      ...gap(1),

      // semaphore roles table
      h2("6.2  Semaphore Roles Explained"),
      ...gap(1),
      compTable(
        ["Semaphore","Initial Value","wait() (P) called by","post() (V) called by","Purpose"],
        [1560,1400,2000,2000,2400],
        [
          ["mutex", "1", "Producer & Consumer before buffer access", "Producer & Consumer after buffer access", "Mutual exclusion on buffer"],
          ["empty", "N (buffer size)", "Producer before inserting", "Consumer after removing", "Count of empty slots available"],
          ["full",  "0", "Consumer before removing", "Producer after inserting", "Count of filled slots available"],
        ]
      ),
      ...gap(2),

      // ══════ SECTION 7 — THREAD SYNC ══════
      h1("7.  Thread Synchronization"),
      ...gap(1),

      h2("7.1  Mutex — Worker Function"),
      p("A mutex (mutual exclusion lock) ensures only one thread executes the critical section at a time. The thread that calls pthread_mutex_lock() owns the mutex and must be the same thread to call pthread_mutex_unlock()."),
      ...gap(1),
      codeBlock(mutexCode),
      ...gap(2),

      h2("7.2  Semaphore — Worker Function"),
      p("A counting semaphore controls how many threads can be inside the critical section simultaneously. sem_wait() decrements the count (blocks at 0). sem_post() increments the count (wakes a blocked thread). Any thread may call post regardless of which called wait."),
      ...gap(1),
      codeBlock(semCode),
      ...gap(2),

      h2("7.3  Worker Function Breakdown"),
      ...gap(1),
      workerTable,
      ...gap(2),

      h2("7.4  Mutex vs Semaphore Comparison"),
      ...gap(1),
      syncCompTable,
      ...gap(2),

      // ══════ SECTION 8 — QUICK REFERENCE ══════
      new Paragraph({ children:[new PageBreak()] }),
      h1("8.  Quick Reference — When to Use What"),
      ...gap(1),
      compTable(
        ["Use Case","Best IPC / Sync"],
        [5400,3960],
        [
          ["Parent → Child one-way data stream",                    "Anonymous Pipe"],
          ["Two-way communication between parent and child",        "Two Anonymous Pipes"],
          ["Unrelated processes, simple one-way stream",            "Named Pipe (FIFO)"],
          ["Large data sharing, maximum speed, no copy",            "Shared Memory + Semaphore"],
          ["Async typed message passing between any processes",     "Message Queue"],
          ["Protect shared variable / data structure in threads",   "Mutex"],
          ["Control how many threads access a resource",           "Counting Semaphore"],
          ["Signal one thread that an event occurred",             "Binary Semaphore"],
          ["Bounded buffer shared between producer and consumer",  "3 Semaphores (mutex+empty+full)"],
        ]
      ),
      ...gap(2),

      // footer line
      new Paragraph({
        children:[new TextRun({ text:"IPC & Thread Synchronization Reference — Operating Systems", size:18, font:"Arial", color:"AAAAAA" })],
        alignment:AlignmentType.CENTER, spacing:sp(240,0)
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/IPC_Thread_Synchronization.docx', buf);
  console.log('Done');
});