; Interface tables: 0/0 (NaN%)
; Virtual methods: 0 / 0
; generated code sizes (bytes): 12796 (incl. 9390 user, 1438 helpers, 12 vtables, 1956 lits); src size 0
; assembly: 9163 lines; density: 26.38 bytes/stmt; (356 stmts)
; total bytes: 193020 (37.4% of 504.0k flash with 323076 free)
; peep hole pass: 191 instructions removed and 399 updated
; peep hole pass: 122 instructions removed and 0 updated
; peep hole pass: 0 instructions removed and 0 updated


; start
    .startaddr 0x2c000
    .hex 708E3B92C615A841C49866C975EE5197 ; magic number
    .hex E9C3DE12CD865ABF ; hex template hash
    .hex 873266330af9dbdb ; replaced in binary by program hash
    .short 15   ; num. globals
    .short 0 ; patched with number of 64 bit words resulting from assembly
    .word _pxt_config_data
    .short 0 ; patched with comm section size
    .short 1 ; number of globals that are not pointers (they come first)
    .word _pxt_iface_member_names
    .word _pxt_lambda_trampoline@fn
    .word _pxt_perf_counters
    .word _pxt_restore_exception_state@fn
    .word _str80 ; name
    ;
; Function main.ts(1,1): <main>
    ;
    .object _main___P1 "main.ts(1,1): <main>"
_main___P1_pre:
    .section code
    .balign 4
_main___P1_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word _main___P1_args@fn
_main___P1_args:
    .section code
_main___P1:
_main___P1_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
_main___P1_locals:
    movs r0, #0
    ldr r7, [r6, #0]
    str r0, [r7, #4]
    @stackempty locals
    movs r0, #3
    ldr r7, [r6, #0]
    str r0, [r7, #44]
    @stackempty locals
    movs r0, #1
    ldr r7, [r6, #0]
    str r0, [r7, #36]
    @stackempty locals
    movs r0, #1
    ldr r7, [r6, #0]
    str r0, [r7, #40]
    @stackempty locals
    movs r0, #66
    ldr r7, [r6, #0]
    str r0, [r7, #32]
    @stackempty locals
    movs r0, #0
    ldr r7, [r6, #0]
    str r0, [r7, #8]
    @stackempty locals
    movs r0, #31
    ldr r7, [r6, #0]
    str r0, [r7, #52]
    @stackempty locals
    movs r0, #181
    ldr r7, [r6, #0]
    str r0, [r7, #56]
    @stackempty locals
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::startProtocol
    @stackempty locals
    movs r0, #4
    lsls r0, r0, #8
    adds r0, #177
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    bl basic_showIcon__P383
_proccall81:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    bl diffDrive_resetPose__P935
_proccall82:
    @stackempty locals
    movs r0, #1
    push {r0} ; proc-arg
    movs r0, #21
    push {r0} ; proc-arg
    bl diffDrive_move__P971
_proccall83:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    movs r0, #91
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    bl diffDrive_move__P971
_proccall84:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    movs r0, #4
    lsls r0, r0, #8
    adds r0, #177
    push {r0} ; proc-arg
    movs r0, #5
    push {r0} ; proc-arg
    bl basic_showIcon__P383
_proccall85:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_2 ; inline__P1093_Lit      
    push {r0} ; proc-arg
    bl _conv_1
    movs r0, #1
    mov r7, sp
    str r7, [r6, #4]
    bl input::onButtonPressed
    add sp, #4*1 ; pop locals 1
    @stackempty locals
    ldr r0, _ldlit_3 ; inline__P1102_Lit      
    push {r0} ; proc-arg
    bl _conv_1
    movs r0, #2
    mov r7, sp
    str r7, [r6, #4]
    bl input::onButtonPressed
    add sp, #4*1 ; pop locals 1
    @stackempty locals
    ldr r0, _ldlit_4 ; inline__P1111_Lit      
    push {r0} ; proc-arg
    bl _conv_1
    movs r0, #3
    mov r7, sp
    str r7, [r6, #4]
    bl input::onButtonPressed
    add sp, #4*1 ; pop locals 1
    @stackempty locals
    ldr r0, _ldlit_5 ; inline__P1118_Lit      
    push {r0} ; proc-arg
    ldr r0, _ldlit_6 ; _str66      
    push {r0} ; proc-arg
    bl diffDrive_onRun__P926
_proccall86:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_7 ; inline__P1122_Lit      
    push {r0} ; proc-arg
    ldr r0, _ldlit_8 ; _str67      
    push {r0} ; proc-arg
    bl diffDrive_onRun__P926
_proccall87:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_9 ; inline__P1126_Lit      
    push {r0} ; proc-arg
    ldr r0, _ldlit_10 ; _str68      
    push {r0} ; proc-arg
    bl diffDrive_onRun__P926
_proccall88:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_11 ; inline__P1130_Lit      
    push {r0} ; proc-arg
    ldr r0, _ldlit_12 ; _str69      
    push {r0} ; proc-arg
    bl diffDrive_onRun__P926
_proccall89:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_13 ; inline__P1143_Lit      
    push {r0} ; proc-arg
    ldr r0, _ldlit_14 ; _str71      
    push {r0} ; proc-arg
    bl diffDrive_onRun__P926
_proccall90:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_15 ; inline__P1155_Lit      
    push {r0} ; proc-arg
    ldr r0, _ldlit_16 ; _str73      
    push {r0} ; proc-arg
    bl diffDrive_onRun__P926
_proccall91:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_17 ; inline__P1167_Lit      
    push {r0} ; proc-arg
    ldr r0, _ldlit_18 ; _str75      
    push {r0} ; proc-arg
    bl diffDrive_onRun__P926
_proccall92:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_19 ; inline__P1186_Lit      
    push {r0} ; proc-arg
    bl diffDrive_onRunCommand__P927
_proccall93:
    add sp, #4*1 ; pop locals 1
    @stackempty locals
    ldr r0, _ldlit_20 ; _str79      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    movs r0, #4
    lsls r0, r0, #8
    adds r0, #177
    push {r0} ; proc-arg
    movs r0, #41
    push {r0} ; proc-arg
    bl basic_showIcon__P383
_proccall94:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.ret.1:
    @stackempty locals
    movs r0, #0
.final_0_1:
_main___P1_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(44,33): inline
    ;
    .object inline__P1093 "main.ts(44,33): inline"
inline__P1093_pre:
    .section code
    .balign 4
inline__P1093_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1093_args@fn
inline__P1093_args:
    .section code
inline__P1093:
inline__P1093_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1093_locals:
    ldr r0, _ldlit_21 ; _str63      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    bl driveSquare__P1087
_proccall95:
    @stackempty locals
.ret.1093:
    @stackempty locals
    movs r0, #0
.final_0_2:
inline__P1093_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(48,33): inline
    ;
    .object inline__P1102 "main.ts(48,33): inline"
inline__P1102_pre:
    .section code
    .balign 4
inline__P1102_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1102_args@fn
inline__P1102_args:
    .section code
inline__P1102:
inline__P1102_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1102_locals:
    ldr r0, _ldlit_22 ; _str64      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    bl trackProgress__P1089
_proccall96:
    @stackempty locals
.ret.1102:
    @stackempty locals
    movs r0, #0
.final_0_3:
inline__P1102_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(52,34): inline
    ;
    .object inline__P1111 "main.ts(52,34): inline"
inline__P1111_pre:
    .section code
    .balign 4
inline__P1111_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1111_args@fn
inline__P1111_args:
    .section code
inline__P1111:
inline__P1111_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1111_locals:
    ldr r0, _ldlit_23 ; _str65      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    bl emergencyStop__P1088
_proccall97:
    @stackempty locals
.ret.1111:
    @stackempty locals
    movs r0, #0
.final_0_4:
inline__P1111_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(74,27): inline
    ;
    .object inline__P1118 "main.ts(74,27): inline"
inline__P1118_pre:
    .section code
    .balign 4
inline__P1118_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1118_args@fn
inline__P1118_args:
    cmp r4, #1
    bge inline__P1118_nochk
    push {lr}
    bl _expand_args_1_2
    bl inline__P1118_nochk
    @dummystack 1
    add sp, #4*1
    pop {pc}
    .section code
inline__P1118:
inline__P1118_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1118_locals:
    bl driveSquare__P1087
_proccall98:
    @stackempty locals
.ret.1118:
    @stackempty locals
    movs r0, #0
.final_0_5:
inline__P1118_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(75,26): inline
    ;
    .object inline__P1122 "main.ts(75,26): inline"
inline__P1122_pre:
    .section code
    .balign 4
inline__P1122_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1122_args@fn
inline__P1122_args:
    cmp r4, #1
    bge inline__P1122_nochk
    push {lr}
    bl _expand_args_1_2
    bl inline__P1122_nochk
    @dummystack 1
    add sp, #4*1
    pop {pc}
    .section code
inline__P1122:
inline__P1122_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1122_locals:
    bl trackProgress__P1089
_proccall99:
    @stackempty locals
.ret.1122:
    @stackempty locals
    movs r0, #0
.final_0_6:
inline__P1122_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(76,25): inline
    ;
    .object inline__P1126 "main.ts(76,25): inline"
inline__P1126_pre:
    .section code
    .balign 4
inline__P1126_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1126_args@fn
inline__P1126_args:
    cmp r4, #1
    bge inline__P1126_nochk
    push {lr}
    bl _expand_args_1_2
    bl inline__P1126_nochk
    @dummystack 1
    add sp, #4*1
    pop {pc}
    .section code
inline__P1126:
inline__P1126_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1126_locals:
    bl emergencyStop__P1088
_proccall100:
    @stackempty locals
.ret.1126:
    @stackempty locals
    movs r0, #0
.final_0_7:
inline__P1126_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(78,22): inline
    ;
    .object inline__P1130 "main.ts(78,22): inline"
inline__P1130_pre:
    .section code
    .balign 4
inline__P1130_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1130_args@fn
inline__P1130_args:
    cmp r4, #1
    bge inline__P1130_nochk
    push {lr}
    bl _expand_args_1_2
    bl inline__P1130_nochk
    @dummystack 1
    add sp, #4*1
    pop {pc}
    .section code
inline__P1130:
inline__P1130_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1130_locals:
    ldr r0, _ldlit_24 ; _str70      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    movs r0, #1
    movs r1, #3
    movs r2, #1
    mov r7, sp
    str r7, [r6, #4]
    bl control::raiseEvent
    @stackempty locals
.ret.1130:
    @stackempty locals
    movs r0, #0
.final_0_8:
inline__P1130_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(85,22): inline
    ;
    .object inline__P1143 "main.ts(85,22): inline"
inline__P1143_pre:
    .section code
    .balign 4
inline__P1143_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1143_args@fn
inline__P1143_args:
    cmp r4, #1
    bge inline__P1143_nochk
    push {lr}
    bl _expand_args_1_2
    bl inline__P1143_nochk
    @dummystack 1
    add sp, #4*1
    pop {pc}
    .section code
inline__P1143:
inline__P1143_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1143_locals:
    ldr r0, _ldlit_25 ; _str72      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    movs r0, #2
    movs r1, #3
    movs r2, #1
    mov r7, sp
    str r7, [r6, #4]
    bl control::raiseEvent
    @stackempty locals
.ret.1143:
    @stackempty locals
    movs r0, #0
.final_0_9:
inline__P1143_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(92,23): inline
    ;
    .object inline__P1155 "main.ts(92,23): inline"
inline__P1155_pre:
    .section code
    .balign 4
inline__P1155_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1155_args@fn
inline__P1155_args:
    cmp r4, #1
    bge inline__P1155_nochk
    push {lr}
    bl _expand_args_1_2
    bl inline__P1155_nochk
    @dummystack 1
    add sp, #4*1
    pop {pc}
    .section code
inline__P1155:
inline__P1155_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1155_locals:
    ldr r0, _ldlit_26 ; _str74      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    movs r0, #3
    movs r1, #3
    movs r2, #1
    mov r7, sp
    str r7, [r6, #4]
    bl control::raiseEvent
    @stackempty locals
.ret.1155:
    @stackempty locals
    movs r0, #0
.final_0_10:
inline__P1155_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(102,25): inline
    ;
    .object inline__P1167 "main.ts(102,25): inline"
inline__P1167_pre:
    .section code
    .balign 4
inline__P1167_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1167_args@fn
inline__P1167_args:
    cmp r4, #1
    bge inline__P1167_nochk
    push {lr}
    bl _expand_args_1_2
    bl inline__P1167_nochk
    @dummystack 1
    add sp, #4*1
    pop {pc}
    .section code
inline__P1167:
inline__P1167_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1167_locals:
    bl diffDrive_heading__P934
_proccall101:
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    bl _conv_3
    ldr r0, _ldlit_27 ; _str76      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    add sp, #4*1 ; pop locals 1
    @stackempty locals
    movs r0, #4
    lsls r0, r0, #8
    adds r0, #177
    push {r0} ; proc-arg
    movs r0, #5
    push {r0} ; proc-arg
    bl basic_showIcon__P383
_proccall102:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    movs r0, #75
    lsls r0, r0, #2
    mov r7, sp
    str r7, [r6, #4]
    bl basic::pause
    @stackempty locals
    mov r7, sp
    str r7, [r6, #4]
    bl basic::clearScreen
    @stackempty locals
.ret.1167:
    @stackempty locals
    movs r0, #0
.final_0_11:
inline__P1167_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(111,24): inline
    ;
    .object inline__P1186 "main.ts(111,24): inline"
inline__P1186_pre:
    .section code
    .balign 4
inline__P1186_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word inline__P1186_args@fn
inline__P1186_args:
    cmp r4, #2
    bge inline__P1186_nochk
    push {lr}
    bl _expand_args_2_5
    bl inline__P1186_nochk
    @dummystack 2
    add sp, #4*2
    pop {pc}
    .section code
inline__P1186:
inline__P1186_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
inline__P1186_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_3
    ldr r0, _ldlit_28 ; _str77      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    bl _conv_4
    ldr r1, _ldlit_29 ; _str78      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl _conv_6
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    add sp, #4*1 ; pop locals 1
    @stackempty locals
.ret.1186:
    @stackempty locals
    movs r0, #0
.final_0_12:
inline__P1186_end:
    pop {pc}
.object PUSH
.balign 4
_ldlit_2:
 .word inline__P1093_Lit
_ldlit_3:
 .word inline__P1102_Lit
_ldlit_4:
 .word inline__P1111_Lit
_ldlit_5:
 .word inline__P1118_Lit
_ldlit_6:
 .word _str66
_ldlit_7:
 .word inline__P1122_Lit
_ldlit_8:
 .word _str67
_ldlit_9:
 .word inline__P1126_Lit
_ldlit_10:
 .word _str68
_ldlit_11:
 .word inline__P1130_Lit
_ldlit_12:
 .word _str69
_ldlit_13:
 .word inline__P1143_Lit
_ldlit_14:
 .word _str71
_ldlit_15:
 .word inline__P1155_Lit
_ldlit_16:
 .word _str73
_ldlit_17:
 .word inline__P1167_Lit
_ldlit_18:
 .word _str75
_ldlit_19:
 .word inline__P1186_Lit
_ldlit_20:
 .word _str79
_ldlit_21:
 .word _str63
_ldlit_22:
 .word _str64
_ldlit_23:
 .word _str65
_ldlit_24:
 .word _str70
_ldlit_25:
 .word _str72
_ldlit_26:
 .word _str74
_ldlit_27:
 .word _str76
_ldlit_28:
 .word _str77
_ldlit_29:
 .word _str78
.object POP
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/run.ts(96,5): diffDrive.onRunCommand
    ;
    .object diffDrive_onRunCommand__P927 "nezha-diffdrive/src/blocks/run.ts(96,5): diffDrive.onRunCommand"
diffDrive_onRunCommand__P927_pre:
    .section code
    .balign 4
    .section code
diffDrive_onRunCommand__P927:
diffDrive_onRunCommand__P927_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_onRunCommand__P927_locals:
    bl diffDrive_ensureRunState__P922
_proccall103:
    @stackempty locals
    bl diffDrive_wireRunDispatch__P925
_proccall104:
    @stackempty locals
    ldr r7, [r6, #0]
    ldr r0, [r7, #12]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_8
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::push
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.ret.927:
    @stackempty locals
    movs r0, #0
.final_0_13:
diffDrive_onRunCommand__P927_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/run.ts(41,5): diffDrive.wireRunDispatch
    ;
    .object diffDrive_wireRunDispatch__P925 "nezha-diffdrive/src/blocks/run.ts(41,5): diffDrive.wireRunDispatch"
diffDrive_wireRunDispatch__P925_pre:
    .section code
    .balign 4
    .section code
diffDrive_wireRunDispatch__P925:
diffDrive_wireRunDispatch__P925_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_wireRunDispatch__P925_locals:
    ldr r7, [r6, #0]
    ldr r0, [r7, #16]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_0_14      
.jmpz105:
    b .ret.925      
.else_0_14:
.afterif_1_14:
    movs r0, #66
    ldr r7, [r6, #0]
    str r0, [r7, #16]
    @stackempty locals
    ldr r0, _ldlit_31 ; diffDrive_wireRunDispatch_inline__P1224_Lit      
    push {r0} ; proc-arg
    bl _conv_9
    movs r0, #32
    lsls r0, r0, #8
    adds r0, #1
    movs r1, #0
    movs r3, #0
    mov r7, sp
    str r7, [r6, #4]
    bl control::onEvent
    add sp, #4*1 ; pop locals 1
    @stackempty locals
.ret.925:
    @stackempty locals
    movs r0, #0
.final_2_14:
diffDrive_wireRunDispatch__P925_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/run.ts(44,46): diffDrive.wireRunDispatch.inline
    ;
    .object diffDrive_wireRunDispatch_inline__P1224 "nezha-diffdrive/src/blocks/run.ts(44,46): diffDrive.wireRunDispatch.inline"
diffDrive_wireRunDispatch_inline__P1224_pre:
    .section code
    .balign 4
diffDrive_wireRunDispatch_inline__P1224_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word diffDrive_wireRunDispatch_inline__P1224_args@fn
diffDrive_wireRunDispatch_inline__P1224_args:
    .section code
diffDrive_wireRunDispatch_inline__P1224:
diffDrive_wireRunDispatch_inline__P1224_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
diffDrive_wireRunDispatch_inline__P1224_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl control::eventValue
    bl _numops_fromInt
    push {r0} ; proc-arg
    bl _conv_10
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::runCommandText
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl String_::length
    add sp, #4*1 ; pop locals 1
    bl _numops_fromInt
    movs r1, #1
    bl _cmp_eq
    beq .else_0_15      
.jmpz106:
    b .ret.1224      
.else_0_15:
.afterif_1_15:
    bl diffDrive_ensureRunState__P922
_proccall107:
    @stackempty locals
    movs r0, #0
    push {r0} ; proc-arg
    ldr r0, _ldlit_32 ; _str57      
    push {r0} ; proc-arg
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl helpers_stringSplit__P223
_proccall108:
    add sp, #4*3 ; pop locals 3
    ldr r7, [r6, #0]
    str r0, [r7, #20]
    @stackempty locals
    ldr r7, [r6, #0]
    ldr r0, [r7, #20]
    push {r0} ; proc-arg
    movs r1, #1
    bl _pxt_array_get
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@1]
    @stackempty locals
    movs r0, #1
    str r0, [sp, locals@2]
    @stackempty locals
.fortop.1243:
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    ldr r7, [r6, #0]
    ldr r0, [r7, #24]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _cmp_lt
    add sp, #4*2 ; pop locals 2
    beq .brk.1243      
.jmpz109:
    ldr r7, [r6, #0]
    ldr r0, [r7, #24]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
    ldr r1, [sp, locals@1]
    bl _cmp_eq
    beq .else_2_15      
.jmpz110:
    ldr r7, [r6, #0]
    ldr r0, [r7, #28]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    bl diffDrive_runArg__P929
_proccall111:
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    pop {r1, r2}
    push {r2}
    push {r1}
    ldr r0, [sp, #4*1] ; estack
    bl _lambda_call1_12
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.else_2_15:
.afterif_3_15:
.cont.1243:
    ldr r0, [sp, locals@2]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@2]
    @stackempty locals
    b .fortop.1243      
.brk.1243:
    movs r0, #1
    str r0, [sp, locals@3]
    @stackempty locals
.fortop.1258:
    ldr r0, [sp, locals@3]
    push {r0} ; proc-arg
    ldr r7, [r6, #0]
    ldr r0, [r7, #12]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _cmp_lt
    add sp, #4*2 ; pop locals 2
    beq .brk.1258      
.jmpz113:
    ldr r7, [r6, #0]
    ldr r0, [r7, #12]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@3]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    bl diffDrive_runArg__P929
_proccall114:
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    pop {r1, r2, r3}
    push {r3}
    push {r1}
    push {r2}
    ldr r0, [sp, #4*2] ; estack
    bl _lambda_call2_13
    add sp, #4*3 ; pop locals 3
    @stackempty locals
.cont.1258:
    ldr r0, [sp, locals@3]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@3]
    @stackempty locals
    b .fortop.1258      
.brk.1258:
.ret.1224:
    @stackempty locals
    movs r0, #0
.final_4_15:
    add sp, #4*4 ; pop locals 4
diffDrive_wireRunDispatch_inline__P1224_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/run.ts(125,5): diffDrive.runArg
    ;
    .object diffDrive_runArg__P929 "nezha-diffdrive/src/blocks/run.ts(125,5): diffDrive.runArg"
diffDrive_runArg__P929_pre:
    .section code
    .balign 4
    .section code
diffDrive_runArg__P929:
diffDrive_runArg__P929_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
diffDrive_runArg__P929_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl diffDrive_runArgText__P930
_proccall116:
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl String_::length
    add sp, #4*1 ; pop locals 1
    bl _numops_fromInt
    movs r1, #1
    bl _cmp_eq
    beq .else_0_16      
.jmpz117:
    movs r0, #1
    b .ret.929      
.else_0_16:
.afterif_1_16:
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl String_::toNumber
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@1]
    @stackempty locals
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    bl isNaN__P193
_proccall119:
    add sp, #4*1 ; pop locals 1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .condexprz_2_16      
.jmpz118:
    movs r0, #1
    b .condexprfin_3_16      
.condexprz_2_16:
    ldr r0, [sp, locals@1]
.condexprfin_3_16:
; jmp value (already in r0)
.ret.929:
    @stackempty locals
.final_4_16:
    add sp, #4*2 ; pop locals 2
diffDrive_runArg__P929_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(13,1): isNaN
    ;
    .object isNaN__P193 "core/pxt-helpers.ts(13,1): isNaN"
isNaN__P193_pre:
    .section code
    .balign 4
    .section code
isNaN__P193:
isNaN__P193_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
isNaN__P193_locals:
    ldr r0, [sp, args@0]
    movs r1, #1
    bl _numops_subs
    str r0, [sp, args@0]
    @stackempty locals
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    mov r7, sp
    str r7, [r6, #4]
    bl numops::neqq
    add sp, #4*2 ; pop locals 2
.ret.193:
    @stackempty locals
.final_0_17:
isNaN__P193_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/run.ts(134,5): diffDrive.runArgText
    ;
    .object diffDrive_runArgText__P930 "nezha-diffdrive/src/blocks/run.ts(134,5): diffDrive.runArgText"
diffDrive_runArgText__P930_pre:
    .section code
    .balign 4
    .section code
diffDrive_runArgText__P930:
diffDrive_runArgText__P930_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_runArgText__P930_locals:
    ldr r7, [r6, #0]
    ldr r0, [r7, #20]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    mov r7, sp
    str r7, [r6, #4]
    bl Boolean_::bang
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    push {r0}; tmpstore @1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBool
    cmp r0, #0
    beq .lazySkip_2_18      
.jmpz120:
    ldr r0, [sp, #4*0] ; tmpref @1
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .lazy_1_18      
.lazySkip_2_18:
    ldr r0, [sp, #0]      
    ldr r0, [sp, #4*0] ; estack
    add sp, #4*1 ; pop locals 1
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    movs r1, #1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::lt
    add sp, #4*1 ; pop locals 1
.lazy_1_18:
; jmp value (already in r0)
    push {r0}; tmpstore @1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBool
    cmp r0, #0
    beq .lazySkip_4_18      
.jmpz121:
    ldr r0, [sp, #4*0] ; tmpref @1
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .lazy_3_18      
.lazySkip_4_18:
    ldr r0, [sp, #0]      
    ldr r0, [sp, #4*0] ; estack
    add sp, #4*1 ; pop locals 1
    ldr r0, [sp, args@0]
    movs r1, #3
    bl _numops_adds
    push {r0} ; proc-arg
    ldr r7, [r6, #0]
    ldr r0, [r7, #20]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    mov r7, sp
    str r7, [r6, #4]
    bl numops::ge
    add sp, #4*2 ; pop locals 2
.lazy_3_18:
; jmp value (already in r0)
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_0_18      
.jmpz122:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    b .ret.930      
.else_0_18:
.afterif_5_18:
    ldr r7, [r6, #0]
    ldr r0, [r7, #20]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    movs r1, #3
    bl _numops_adds
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
.ret.930:
    @stackempty locals
.final_6_18:
diffDrive_runArgText__P930_end:
    pop {pc}
.object PUSH
.balign 4
_ldlit_31:
 .word diffDrive_wireRunDispatch_inline__P1224_Lit
_ldlit_32:
 .word _str57
.object POP
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(436,5): helpers.stringSplit
    ;
    .object helpers_stringSplit__P223 "core/pxt-helpers.ts(436,5): helpers.stringSplit"
helpers_stringSplit__P223_pre:
    .section code
    .balign 4
    .section code
helpers_stringSplit__P223:
helpers_stringSplit__P223_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
helpers_stringSplit__P223_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::mk
    str r0, [sp, locals@0]
    @stackempty locals
    movs r0, #1
    str r0, [sp, locals@1]
    @stackempty locals
    ldr r0, [sp, args@2]
    movs r1, #0
    bl _cmp_eqq
    beq .else_0_19      
.jmpz123:
    ldr r0, _ldlit_34 ; 1073741825      
    movs r1, #3
    bl _numops_subs
    str r0, [sp, locals@1]
    @stackempty locals
    b .afterif_1_19      
.else_0_19:
    ldr r0, [sp, args@2]
    movs r1, #1
    bl _cmp_lt
    beq .else_2_19      
.jmpz124:
    movs r0, #1
    str r0, [sp, locals@1]
    @stackempty locals
    b .afterif_3_19      
.else_2_19:
    ldr r0, [sp, args@2]
    movs r1, #1
    bl _numops_orrs
    str r0, [sp, locals@1]
    @stackempty locals
.afterif_3_19:
.afterif_1_19:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl String_::length
    add sp, #4*1 ; pop locals 1
    bl _numops_fromInt
    str r0, [sp, locals@2]
    @stackempty locals
    movs r0, #1
    str r0, [sp, locals@3]
    @stackempty locals
    ldr r0, [sp, args@1]
    str r0, [sp, locals@4]
    @stackempty locals
    ldr r0, [sp, locals@1]
    movs r1, #1
    bl _cmp_eq
    beq .else_4_19      
.jmpz125:
    ldr r0, [sp, locals@0]
    b .ret.223      
.else_4_19:
.afterif_5_19:
    ldr r0, [sp, args@1]
    movs r1, #0
    bl _cmp_eqq
    beq .else_6_19      
.jmpz126:
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r2, [sp, #4*0] ; estack
    movs r1, #1
    bl _pxt_array_set
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, [sp, locals@0]
    b .ret.223      
.else_6_19:
.afterif_7_19:
    ldr r0, [sp, locals@2]
    movs r1, #1
    bl _cmp_eq
    beq .else_8_19      
.jmpz127:
    ldr r0, [sp, locals@4]
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl helpers_splitMatch__P224
_proccall128:
    add sp, #4*3 ; pop locals 3
    str r0, [sp, locals@5]
    @stackempty locals
    ldr r0, [sp, locals@5]
    movs r1, #1
    negs r1, r1
    bl _cmp_gt
    beq .else_9_19      
.jmpz129:
    ldr r0, [sp, locals@0]
    b .ret.223      
.else_9_19:
.afterif_10_19:
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r2, [sp, #4*0] ; estack
    movs r1, #1
    bl _pxt_array_set
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, [sp, locals@0]
    b .ret.223      
.else_8_19:
.afterif_11_19:
    ldr r0, [sp, locals@3]
    str r0, [sp, locals@7]
    @stackempty locals
.cont.1357:
    ldr r0, [sp, locals@7]
    ldr r1, [sp, locals@2]
    bl _cmp_neq
    beq .brk.1357      
.jmpz130:
    ldr r0, [sp, locals@4]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@7]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl helpers_splitMatch__P224
_proccall131:
    add sp, #4*3 ; pop locals 3
    str r0, [sp, locals@8]
    @stackempty locals
    ldr r0, [sp, locals@8]
    movs r1, #1
    bl _cmp_lt
    beq .else_12_19      
.jmpz132:
    ldr r0, [sp, locals@7]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@7]
    @stackempty locals
    b .afterif_13_19      
.else_12_19:
    ldr r0, [sp, locals@8]
    ldr r1, [sp, locals@3]
    bl _cmp_eq
    beq .else_14_19      
.jmpz133:
    ldr r0, [sp, locals@7]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@7]
    @stackempty locals
    b .afterif_15_19      
.else_14_19:
    ldr r0, [sp, locals@7]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@3]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl helpers_stringSlice__P220
_proccall134:
    add sp, #4*3 ; pop locals 3
    str r0, [sp, locals@6]
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@6]
    push {r0} ; proc-arg
    bl _conv_8
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::push
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    ldr r1, [sp, locals@1]
    bl _cmp_eq
    beq .else_16_19      
.jmpz135:
    ldr r0, [sp, locals@0]
    b .ret.223      
.else_16_19:
.afterif_17_19:
    ldr r0, [sp, locals@8]
    str r0, [sp, locals@3]
    @stackempty locals
    ldr r0, [sp, locals@3]
    str r0, [sp, locals@7]
    @stackempty locals
.afterif_15_19:
.afterif_13_19:
    b .cont.1357      
.brk.1357:
    ldr r0, [sp, locals@7]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@3]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl helpers_stringSlice__P220
_proccall136:
    add sp, #4*3 ; pop locals 3
    str r0, [sp, locals@6]
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@6]
    push {r0} ; proc-arg
    bl _conv_8
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::push
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, [sp, locals@0]
.ret.223:
    @stackempty locals
.final_18_19:
    add sp, #4*9 ; pop locals 9
helpers_stringSplit__P223_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(386,5): helpers.stringSlice
    ;
    .object helpers_stringSlice__P220 "core/pxt-helpers.ts(386,5): helpers.stringSlice"
helpers_stringSlice__P220_pre:
    .section code
    .balign 4
    .section code
helpers_stringSlice__P220:
helpers_stringSlice__P220_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    @stackmark locals
helpers_stringSlice__P220_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl String_::length
    add sp, #4*1 ; pop locals 1
    bl _numops_fromInt
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, args@1]
    movs r1, #1
    bl _cmp_lt
    beq .else_0_20      
.jmpz137:
    ldr r0, [sp, locals@0]
    ldr r1, [sp, args@1]
    bl _numops_adds
    mov r3, r0
    movs r0, #1
    push {r0} ; proc-arg
    push {r3} ; the one arg
    bl Math_max__P231
_proccall138:
    add sp, #4*2 ; pop locals 2
    str r0, [sp, args@1]
    @stackempty locals
.else_0_20:
.afterif_1_20:
    ldr r0, [sp, args@2]
    movs r1, #0
    bl _cmp_eqq
    beq .else_2_20      
.jmpz139:
    ldr r0, [sp, locals@0]
    str r0, [sp, args@2]
    @stackempty locals
    b .afterif_3_20      
.else_2_20:
    ldr r0, [sp, args@2]
    movs r1, #6
    bl _cmp_eqq
    beq .else_4_20      
.jmpz140:
    movs r0, #1
    str r0, [sp, args@2]
    @stackempty locals
.else_4_20:
.afterif_5_20:
.afterif_3_20:
    ldr r0, [sp, args@2]
    movs r1, #1
    bl _cmp_lt
    beq .else_6_20      
.jmpz141:
    ldr r0, [sp, locals@0]
    ldr r1, [sp, args@2]
    bl _numops_adds
    str r0, [sp, args@2]
    @stackempty locals
.else_6_20:
.afterif_7_20:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    ldr r0, [sp, args@2]
    ldr r1, [sp, args@1]
    bl _numops_subs
    push {r0} ; proc-arg
    bl _conv_14
    mov r7, sp
    str r7, [r6, #4]
    bl String_::substr
    add sp, #4*3 ; pop locals 3
.ret.220:
    @stackempty locals
.final_8_20:
    add sp, #4*1 ; pop locals 1
helpers_stringSlice__P220_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(560,5): Math.max
    ;
    .object Math_max__P231 "core/pxt-helpers.ts(560,5): Math.max"
Math_max__P231_pre:
    .section code
    .balign 4
    .section code
Math_max__P231:
Math_max__P231_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
Math_max__P231_locals:
    ldr r0, [sp, args@0]
    ldr r1, [sp, args@1]
    bl _cmp_ge
    beq .else_0_21      
.jmpz142:
    ldr r0, [sp, args@0]
    b .ret.231      
.else_0_21:
.afterif_1_21:
    ldr r0, [sp, args@1]
.ret.231:
    @stackempty locals
.final_2_21:
Math_max__P231_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(482,5): helpers.splitMatch
    ;
    .object helpers_splitMatch__P224 "core/pxt-helpers.ts(482,5): helpers.splitMatch"
helpers_splitMatch__P224_pre:
    .section code
    .balign 4
    .section code
helpers_splitMatch__P224:
helpers_splitMatch__P224_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
helpers_splitMatch__P224_locals:
    ldr r0, [sp, args@2]
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl String_::length
    add sp, #4*1 ; pop locals 1
    bl _numops_fromInt
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl String_::length
    add sp, #4*1 ; pop locals 1
    bl _numops_fromInt
    str r0, [sp, locals@1]
    @stackempty locals
    ldr r0, [sp, args@1]
    ldr r1, [sp, locals@0]
    bl _numops_adds
    ldr r1, [sp, locals@1]
    bl _cmp_gt
    beq .else_0_22      
.jmpz143:
    movs r0, #1
    negs r0, r0
    b .ret.224      
.else_0_22:
.afterif_1_22:
    movs r0, #1
    str r0, [sp, locals@2]
    @stackempty locals
.fortop.1455:
    ldr r0, [sp, locals@2]
    ldr r1, [sp, locals@0]
    bl _cmp_lt
    beq .brk.1455      
.jmpz144:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    ldr r1, [sp, locals@2]
    bl _numops_adds
    push {r0} ; proc-arg
    bl _conv_15
    mov r7, sp
    str r7, [r6, #4]
    bl String_::charAt
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    ldr r0, [sp, args@2]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    bl _conv_15
    mov r7, sp
    str r7, [r6, #4]
    bl String_::charAt
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _cmp_neq
    add sp, #4*2 ; pop locals 2
    beq .else_2_22      
.jmpz145:
    movs r0, #1
    negs r0, r0
    b .ret.224      
    b .afterif_3_22      
.object PUSH
.balign 4
_ldlit_34:
 .word 1073741825
.object POP
.else_2_22:
.afterif_3_22:
.cont.1455:
    ldr r0, [sp, locals@2]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@2]
    @stackempty locals
    b .fortop.1455      
.brk.1455:
    ldr r0, [sp, args@1]
    ldr r1, [sp, locals@0]
    bl _numops_adds
.ret.224:
    @stackempty locals
.final_4_22:
    add sp, #4*3 ; pop locals 3
helpers_splitMatch__P224_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/run.ts(21,5): diffDrive.ensureRunState
    ;
    .object diffDrive_ensureRunState__P922 "nezha-diffdrive/src/blocks/run.ts(21,5): diffDrive.ensureRunState"
diffDrive_ensureRunState__P922_pre:
    .section code
    .balign 4
    .section code
diffDrive_ensureRunState__P922:
diffDrive_ensureRunState__P922_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_ensureRunState__P922_locals:
    ldr r7, [r6, #0]
    ldr r0, [r7, #20]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    mov r7, sp
    str r7, [r6, #4]
    bl Boolean_::bang
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_0_23      
.jmpz146:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::mk
    ldr r7, [r6, #0]
    str r0, [r7, #20]
    @stackempty locals
.else_0_23:
.afterif_1_23:
    ldr r7, [r6, #0]
    ldr r0, [r7, #24]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    mov r7, sp
    str r7, [r6, #4]
    bl Boolean_::bang
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_2_23      
.jmpz147:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::mk
    ldr r7, [r6, #0]
    str r0, [r7, #24]
    @stackempty locals
.else_2_23:
.afterif_3_23:
    ldr r7, [r6, #0]
    ldr r0, [r7, #28]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    mov r7, sp
    str r7, [r6, #4]
    bl Boolean_::bang
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_4_23      
.jmpz148:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::mk
    ldr r7, [r6, #0]
    str r0, [r7, #28]
    @stackempty locals
.else_4_23:
.afterif_5_23:
    ldr r7, [r6, #0]
    ldr r0, [r7, #12]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    mov r7, sp
    str r7, [r6, #4]
    bl Boolean_::bang
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_6_23      
.jmpz149:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::mk
    ldr r7, [r6, #0]
    str r0, [r7, #12]
    @stackempty locals
.else_6_23:
.afterif_7_23:
.ret.922:
    @stackempty locals
    movs r0, #0
.final_8_23:
diffDrive_ensureRunState__P922_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/pose.ts(30,5): diffDrive.heading
    ;
    .object diffDrive_heading__P934 "nezha-diffdrive/src/blocks/pose.ts(30,5): diffDrive.heading"
diffDrive_heading__P934_pre:
    .section code
    .balign 4
    .section code
diffDrive_heading__P934:
diffDrive_heading__P934_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_heading__P934_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::poseHeading
    bl _numops_fromInt
    push {r0} ; proc-arg
    movs r1, #201
    mov r7, sp
    str r7, [r6, #4]
    bl numops::div
    add sp, #4*1 ; pop locals 1
.ret.934:
    @stackempty locals
.final_0_24:
diffDrive_heading__P934_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/run.ts(80,5): diffDrive.onRun
    ;
    .object diffDrive_onRun__P926 "nezha-diffdrive/src/blocks/run.ts(80,5): diffDrive.onRun"
diffDrive_onRun__P926_pre:
    .section code
    .balign 4
    .section code
diffDrive_onRun__P926:
diffDrive_onRun__P926_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_onRun__P926_locals:
    bl diffDrive_ensureRunState__P922
_proccall150:
    @stackempty locals
    bl diffDrive_wireRunDispatch__P925
_proccall151:
    @stackempty locals
    ldr r7, [r6, #0]
    ldr r0, [r7, #24]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_8
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::push
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r7, [r6, #0]
    ldr r0, [r7, #28]
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl _conv_8
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::push
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.ret.926:
    @stackempty locals
    movs r0, #0
.final_0_25:
diffDrive_onRun__P926_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(21,1): emergencyStop
    ;
    .object emergencyStop__P1088 "main.ts(21,1): emergencyStop"
emergencyStop__P1088_pre:
    .section code
    .balign 4
    .section code
emergencyStop__P1088:
emergencyStop__P1088_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
emergencyStop__P1088_locals:
    ldr r0, _ldlit_36 ; _str60      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    bl diffDrive_stop__P936
_proccall152:
    @stackempty locals
    movs r0, #4
    lsls r0, r0, #8
    adds r0, #177
    push {r0} ; proc-arg
    movs r0, #7
    push {r0} ; proc-arg
    bl basic_showIcon__P383
_proccall153:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.ret.1088:
    @stackempty locals
    movs r0, #0
.final_0_26:
emergencyStop__P1088_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/stop.ts(15,5): diffDrive.stop
    ;
    .object diffDrive_stop__P936 "nezha-diffdrive/src/blocks/stop.ts(15,5): diffDrive.stop"
diffDrive_stop__P936_pre:
    .section code
    .balign 4
    .section code
diffDrive_stop__P936:
diffDrive_stop__P936_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_stop__P936_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::stopAll
    @stackempty locals
.ret.936:
    @stackempty locals
    movs r0, #0
.final_0_27:
diffDrive_stop__P936_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(27,1): trackProgress
    ;
    .object trackProgress__P1089 "main.ts(27,1): trackProgress"
trackProgress__P1089_pre:
    .section code
    .balign 4
    .section code
trackProgress__P1089:
trackProgress__P1089_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
trackProgress__P1089_locals:
    ldr r0, _ldlit_37 ; _str61      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    movs r0, #4
    lsls r0, r0, #8
    adds r0, #177
    push {r0} ; proc-arg
    movs r0, #7
    push {r0} ; proc-arg
    bl basic_showIcon__P383
_proccall154:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r0, _ldlit_38 ; trackProgress_inline__P1528_Lit      
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    movs r0, #61
    push {r0} ; proc-arg
    bl diffDrive_whileMoving__P978
_proccall155:
    add sp, #4*3 ; pop locals 3
    @stackempty locals
    mov r7, sp
    str r7, [r6, #4]
    bl basic::clearScreen
    @stackempty locals
    ldr r0, _ldlit_39 ; _str62      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
.ret.1089:
    @stackempty locals
    movs r0, #0
.final_0_28:
trackProgress__P1089_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(30,34): trackProgress.inline
    ;
    .object trackProgress_inline__P1528 "main.ts(30,34): trackProgress.inline"
trackProgress_inline__P1528_pre:
    .section code
    .balign 4
trackProgress_inline__P1528_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word trackProgress_inline__P1528_args@fn
trackProgress_inline__P1528_args:
    cmp r4, #3
    bge trackProgress_inline__P1528_nochk
    push {lr}
    bl _expand_args_3_16
    bl trackProgress_inline__P1528_nochk
    @dummystack 3
    add sp, #4*3
    pop {pc}
    .section code
trackProgress_inline__P1528:
trackProgress_inline__P1528_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
trackProgress_inline__P1528_locals:
    bl diffDrive_moveProgress__P976
_proccall156:
    push {r0} ; proc-arg
    movs r1, #201
    mov r7, sp
    str r7, [r6, #4]
    bl numops::muls
    add sp, #4*1 ; pop locals 1
    mov r3, r0
    movs r0, #14
    push {r0} ; proc-arg
    movs r0, #201
    push {r0} ; proc-arg
    push {r3} ; the one arg
    bl led_plotBarGraph__P528
_proccall157:
    add sp, #4*3 ; pop locals 3
    @stackempty locals
    movs r0, #3
    mov r7, sp
    str r7, [r6, #4]
    bl input::buttonIsPressed
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_0_29      
.jmpz158:
    bl diffDrive_stopMove__P977
_proccall159:
    @stackempty locals
.else_0_29:
.afterif_1_29:
.ret.1528:
    @stackempty locals
    movs r0, #0
.final_2_29:
trackProgress_inline__P1528_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/motion.ts(330,5): diffDrive.stopMove
    ;
    .object diffDrive_stopMove__P977 "nezha-diffdrive/src/blocks/motion.ts(330,5): diffDrive.stopMove"
diffDrive_stopMove__P977_pre:
    .section code
    .balign 4
    .section code
diffDrive_stopMove__P977:
diffDrive_stopMove__P977_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_stopMove__P977_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::endMove
    @stackempty locals
.ret.977:
    @stackempty locals
    movs r0, #0
.final_0_30:
diffDrive_stopMove__P977_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/motion.ts(316,5): diffDrive.moveProgress
    ;
    .object diffDrive_moveProgress__P976 "nezha-diffdrive/src/blocks/motion.ts(316,5): diffDrive.moveProgress"
diffDrive_moveProgress__P976_pre:
    .section code
    .balign 4
    .section code
diffDrive_moveProgress__P976:
diffDrive_moveProgress__P976_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_moveProgress__P976_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::progress
    bl _numops_fromInt
    push {r0} ; proc-arg
    movs r1, #7
    lsls r1, r1, #8
    adds r1, #209
    mov r7, sp
    str r7, [r6, #4]
    bl numops::div
    add sp, #4*1 ; pop locals 1
.ret.976:
    @stackempty locals
.final_0_31:
diffDrive_moveProgress__P976_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/led.ts(44,5): led.plotBarGraph
    ;
    .object led_plotBarGraph__P528 "core/led.ts(44,5): led.plotBarGraph"
led_plotBarGraph__P528_pre:
    .section code
    .balign 4
    .section code
led_plotBarGraph__P528:
led_plotBarGraph__P528_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
led_plotBarGraph__P528_locals:
    ldr r0, [sp, args@2]
    movs r1, #0
    bl _cmp_eq
    beq .else_0_32      
.jmpz160:
    ldr r7, [r6, #0]
    ldr r0, [r7, #32]
    str r0, [sp, args@2]
    @stackempty locals
.else_0_32:
.afterif_1_32:
    bl input_runningTime__P394
_proccall161:
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, args@2]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_2_32      
.jmpz162:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    mov r3, r0
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    push {r3} ; the one arg
    bl console_logValue__P437
_proccall163:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.else_2_32:
.afterif_3_32:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl isNaN__P193
_proccall165:
    add sp, #4*1 ; pop locals 1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_4_32      
.jmpz164:
    mov r7, sp
    str r7, [r6, #4]
    bl basic::clearScreen
    @stackempty locals
    b .ret.528      
.else_4_32:
.afterif_5_32:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl Math_abs__P229
_proccall166:
    add sp, #4*1 ; pop locals 1
    str r0, [sp, args@0]
    @stackempty locals
    ldr r0, [sp, args@1]
    movs r1, #1
    bl _cmp_gt
    beq .else_6_32      
.jmpz167:
    ldr r0, [sp, args@1]
    ldr r7, [r6, #0]
    str r0, [r7, #36]
    @stackempty locals
    b .afterif_7_32      
.else_6_32:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r7, [r6, #0]
    ldr r0, [r7, #36]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    mov r7, sp
    str r7, [r6, #4]
    bl numops::gt
    add sp, #4*2 ; pop locals 2
    push {r0}; tmpstore @1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBool
    cmp r0, #0
    beq .lazySkip_10_32      
.jmpz168:
    ldr r0, [sp, #4*0] ; tmpref @1
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .lazy_9_32      
.lazySkip_10_32:
    ldr r0, [sp, #0]      
    ldr r0, [sp, #4*0] ; estack
    add sp, #4*1 ; pop locals 1
    ldr r0, [sp, locals@0]
    ldr r7, [r6, #0]
    ldr r1, [r7, #40]
    bl _numops_subs
    push {r0} ; proc-arg
    movs r1, #78
    lsls r1, r1, #8
    adds r1, #33
    mov r7, sp
    str r7, [r6, #4]
    bl numops::gt
    add sp, #4*1 ; pop locals 1
.lazy_9_32:
; jmp value (already in r0)
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_8_32      
.jmpz169:
    ldr r0, [sp, args@0]
    ldr r7, [r6, #0]
    str r0, [r7, #36]
    @stackempty locals
    ldr r0, [sp, locals@0]
    ldr r7, [r6, #0]
    str r0, [r7, #40]
    @stackempty locals
.else_8_32:
.afterif_11_32:
.afterif_7_32:
    ldr r7, [r6, #0]
    ldr r0, [r7, #36]
    ldr r1, _ldlit_40 ; _dbl55      
    bl _cmp_lt
    beq .else_12_32      
.jmpz170:
    movs r0, #3
    ldr r7, [r6, #0]
    str r0, [r7, #36]
    @stackempty locals
.else_12_32:
.afterif_13_32:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r7, [r6, #0]
    ldr r0, [r7, #36]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    mov r7, sp
    str r7, [r6, #4]
    bl numops::div
    add sp, #4*2 ; pop locals 2
    str r0, [sp, locals@1]
    @stackempty locals
    movs r0, #1
    str r0, [sp, locals@2]
    @stackempty locals
    movs r0, #9
    str r0, [sp, locals@3]
    @stackempty locals
.fortop.1602:
    ldr r0, [sp, locals@3]
    movs r1, #1
    bl _cmp_ge
    beq .brk.1602      
.jmpz171:
    movs r0, #1
    str r0, [sp, locals@4]
    @stackempty locals
.fortop.1605:
    ldr r0, [sp, locals@4]
    movs r1, #7
    bl _cmp_lt
    beq .brk.1605      
.jmpz172:
    ldr r0, [sp, locals@2]
    ldr r1, [sp, locals@1]
    bl _cmp_gt
    beq .else_14_32      
.jmpz173:
    movs r0, #5
    ldr r1, [sp, locals@4]
    bl _numops_subs
    push {r0} ; proc-arg
    ldr r0, [sp, locals@3]
    push {r0} ; proc-arg
    bl _conv_17
    mov r7, sp
    str r7, [r6, #4]
    bl led::unplot
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    movs r0, #5
    ldr r1, [sp, locals@4]
    bl _numops_adds
    push {r0} ; proc-arg
    ldr r0, [sp, locals@3]
    push {r0} ; proc-arg
    bl _conv_17
    mov r7, sp
    str r7, [r6, #4]
    bl led::unplot
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    b .afterif_15_32      
.else_14_32:
    movs r0, #5
    ldr r1, [sp, locals@4]
    bl _numops_subs
    push {r0} ; proc-arg
    ldr r0, [sp, locals@3]
    push {r0} ; proc-arg
    bl _conv_17
    mov r7, sp
    str r7, [r6, #4]
    bl led::plot
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    movs r0, #5
    ldr r1, [sp, locals@4]
    bl _numops_adds
    push {r0} ; proc-arg
    ldr r0, [sp, locals@3]
    push {r0} ; proc-arg
    bl _conv_17
    mov r7, sp
    str r7, [r6, #4]
    bl led::plot
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.afterif_15_32:
    ldr r0, [sp, locals@2]
    ldr r1, _ldlit_41 ; _dbl56      
    bl _numops_adds
    str r0, [sp, locals@2]
    @stackempty locals
.cont.1605:
    ldr r0, [sp, locals@4]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@4]
    @stackempty locals
    b .fortop.1605      
.brk.1605:
.cont.1602:
    ldr r0, [sp, locals@3]
    movs r1, #3
    bl _numops_subs
    str r0, [sp, locals@3]
    @stackempty locals
    b .fortop.1602      
.brk.1602:
.ret.528:
    @stackempty locals
    movs r0, #0
.final_16_32:
    add sp, #4*5 ; pop locals 5
led_plotBarGraph__P528_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(541,5): Math.abs
    ;
    .object Math_abs__P229 "core/pxt-helpers.ts(541,5): Math.abs"
Math_abs__P229_pre:
    .section code
    .balign 4
    .section code
Math_abs__P229:
Math_abs__P229_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
Math_abs__P229_locals:
    ldr r0, [sp, args@0]
    movs r1, #1
    bl _cmp_lt
    bne .jmpz174
    b .condexprz_0_33      
.object PUSH
.balign 4
_ldlit_36:
 .word _str60
_ldlit_37:
 .word _str61
_ldlit_38:
 .word trackProgress_inline__P1528_Lit
_ldlit_39:
 .word _str62
_ldlit_40:
 .word _dbl55
_ldlit_41:
 .word _dbl56
.object POP
.jmpz174:
    movs r0, #1
    ldr r1, [sp, args@0]
    bl _numops_subs
    b .condexprfin_1_33      
.condexprz_0_33:
    ldr r0, [sp, args@0]
.condexprfin_1_33:
; jmp value (already in r0)
.ret.229:
    @stackempty locals
.final_2_33:
Math_abs__P229_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/console.ts(67,5): console.logValue
    ;
    .object console_logValue__P437 "core/console.ts(67,5): console.logValue"
console_logValue__P437_pre:
    .section code
    .balign 4
    .section code
console_logValue__P437:
console_logValue__P437_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
console_logValue__P437_locals:
    ldr r0, [sp, args@0]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .condexprz_0_34      
.jmpz175:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    push {r0} ; proc-arg
    movs r0, #41
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl console_inspect__P438
_proccall176:
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_18
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_4
    ldr r1, _ldlit_43 ; _str45      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    movs r0, #41
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl console_inspect__P438
_proccall177:
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_6
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
    b .condexprfin_1_34      
.condexprz_0_34:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    push {r0} ; proc-arg
    movs r0, #41
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl console_inspect__P438
_proccall178:
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_18
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
.condexprfin_1_34:
; jmp value (already in r0)
    push {r0} ; proc-arg
    bl console_log__P436
_proccall179:
    add sp, #4*1 ; pop locals 1
    @stackempty locals
.ret.437:
    @stackempty locals
    movs r0, #0
.final_2_34:
console_logValue__P437_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/console.ts(76,5): console.inspect
    ;
    .object console_inspect__P438 "core/console.ts(76,5): console.inspect"
console_inspect__P438_pre:
    .section code
    .balign 4
    .section code
console_inspect__P438:
console_inspect__P438_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
console_inspect__P438_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::typeOf
    add sp, #4*1 ; pop locals 1
    ldr r1, _ldlit_44 ; _str46      
    bl _cmp_eq
    beq .else_0_35      
.jmpz180:
    ldr r0, [sp, args@0]
    b .ret.438      
    b .afterif_1_35      
.else_0_35:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::typeOf
    add sp, #4*1 ; pop locals 1
    ldr r1, _ldlit_45 ; _str47      
    bl _cmp_eq
    beq .else_2_35      
.jmpz181:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_18
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
    b .ret.438      
    b .afterif_3_35      
.else_2_35:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::isArray
    add sp, #4*1 ; pop locals 1
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_4_35      
.jmpz182:
    ldr r0, [sp, args@0]
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    ldr r1, [sp, args@1]
    bl _cmp_le
    beq .else_5_35      
.jmpz183:
    ldr r0, _ldlit_46 ; _str0      
    push {r0} ; proc-arg
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl helpers_arrayJoin__P201
_proccall184:
    add sp, #4*2 ; pop locals 2
    b .ret.438      
    b .afterif_6_35      
.else_5_35:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl helpers_arraySlice__P215
_proccall185:
    add sp, #4*3 ; pop locals 3
    mov r3, r0
    ldr r0, _ldlit_46 ; _str0      
    push {r0} ; proc-arg
    push {r3} ; the one arg
    bl helpers_arrayJoin__P201
_proccall186:
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_18
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_4
    ldr r1, _ldlit_47 ; _str48      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    b .ret.438      
.afterif_6_35:
    b .afterif_7_35      
.else_4_35:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    push {r0} ; proc-arg
    bl _conv_19
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
    str r0, [sp, locals@1]
    @stackempty locals
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    ldr r1, _ldlit_48 ; _str49      
    mov r7, sp
    str r7, [r6, #4]
    bl numops::neq
    add sp, #4*1 ; pop locals 1
    push {r0}; tmpstore @1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBool
    cmp r0, #0
    bne .lazySkip_10_35      
.jmpz187:
    ldr r0, [sp, #4*0] ; tmpref @1
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .lazy_9_35      
.lazySkip_10_35:
    ldr r0, [sp, #0]      
    ldr r0, [sp, #4*0] ; estack
    add sp, #4*1 ; pop locals 1
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    ldr r1, _ldlit_49 ; _str50      
    mov r7, sp
    str r7, [r6, #4]
    bl numops::neq
    add sp, #4*1 ; pop locals 1
.lazy_9_35:
; jmp value (already in r0)
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_8_35      
.jmpz188:
    ldr r0, [sp, locals@1]
    b .ret.438      
.else_8_35:
.afterif_11_35:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl pxtrt::keysOf
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@2]
    @stackempty locals
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    mov r7, sp
    str r7, [r6, #4]
    bl numops::gt
    add sp, #4*2 ; pop locals 2
    str r0, [sp, locals@3]
    @stackempty locals
    ldr r0, [sp, locals@3]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_12_35      
.jmpz189:
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    bl helpers_arraySlice__P215
_proccall190:
    add sp, #4*3 ; pop locals 3
    str r0, [sp, locals@2]
    @stackempty locals
.else_12_35:
.afterif_13_35:
    movs r0, #1
    ldr r1, _ldlit_50 ; console_inspect_inline__P1738_Lit      
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::mkAction
    push {r0}; tmpstore @1
    movs r1, #0
    ldr r2, [sp, args@0]
    mov r7, sp
    str r7, [r6, #4]
    bl pxtrt::stclo
    ldr r0, [sp, locals@3]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .condexprz_14_35      
.jmpz191:
    ldr r0, _ldlit_51 ; _str53      
    b .condexprfin_15_35      
.condexprz_14_35:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
.condexprfin_15_35:
; jmp value (already in r0)
    push {r0}; tmpstore @2
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    push {r0} ; proc-arg
    pop {r1, r2}
    push {r1}
    ldr r0, [sp, #4*2] ; tmpref @1
    push {r0} ; proc-arg
    push {r2}
    bl helpers_arrayReduce__P212
_proccall192:
    add sp, #4*3 ; pop locals 3
    movs r7, #0
    str r7, [sp, #4*1] ; estack
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; tmpref @2
    push {r0} ; proc-arg
    bl _conv_6
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*4 ; pop locals 4
    push {r0} ; proc-arg
    bl _conv_3
    ldr r0, _ldlit_52 ; _str51      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    bl _conv_4
    ldr r1, _ldlit_53 ; _str54      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    b .ret.438      
.afterif_7_35:
.afterif_3_35:
.afterif_1_35:
    movs r0, #0
.ret.438:
    @stackempty locals
.final_16_35:
    add sp, #4*4 ; pop locals 4
console_inspect__P438_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/console.ts(102,17): console.inspect.inline
    ;
    .object console_inspect_inline__P1738 "core/console.ts(102,17): console.inspect.inline"
console_inspect_inline__P1738_pre:
    .section code
    .balign 4
console_inspect_inline__P1738_Lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word console_inspect_inline__P1738_args@fn
console_inspect_inline__P1738_args:
    cmp r4, #2
    bge console_inspect_inline__P1738_nochk
    push {lr}
    bl _expand_args_2_5
    bl console_inspect_inline__P1738_nochk
    @dummystack 2
    add sp, #4*2
    pop {pc}
.object PUSH
.balign 4
_ldlit_43:
 .word _str45
_ldlit_44:
 .word _str46
_ldlit_45:
 .word _str47
_ldlit_46:
 .word _str0
_ldlit_47:
 .word _str48
_ldlit_48:
 .word _str49
_ldlit_49:
 .word _str50
_ldlit_50:
 .word console_inspect_inline__P1738_Lit
_ldlit_51:
 .word _str53
_ldlit_52:
 .word _str51
_ldlit_53:
 .word _str54
.object POP
    .section code
console_inspect_inline__P1738:
console_inspect_inline__P1738_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
console_inspect_inline__P1738_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl _conv_3
    ldr r0, _ldlit_55 ; _str52      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    bl _conv_4
    ldr r1, _ldlit_56 ; _str45      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [r5, #4*3]
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl _conv_18
    bl _pxt_map_get
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_6
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_6
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
.ret.1738:
    @stackempty locals
.final_0_36:
console_inspect_inline__P1738_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(282,5): helpers.arrayReduce
    ;
    .object helpers_arrayReduce__P212 "core/pxt-helpers.ts(282,5): helpers.arrayReduce"
helpers_arrayReduce__P212_pre:
    .section code
    .balign 4
    .section code
helpers_arrayReduce__P212:
helpers_arrayReduce__P212_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
helpers_arrayReduce__P212_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@0]
    @stackempty locals
    movs r0, #1
    str r0, [sp, locals@1]
    @stackempty locals
.fortop.1769:
    ldr r0, [sp, locals@1]
    ldr r1, [sp, locals@0]
    bl _cmp_lt
    beq .brk.1769      
.jmpz193:
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    ldr r0, [sp, args@2]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    pop {r1, r2, r3}
    push {r3}
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    push {r1}
    push {r2}
    ldr r0, [sp, #4*3] ; estack
    bl _lambda_call3_20
    add sp, #4*4 ; pop locals 4
    str r0, [sp, args@2]
    @stackempty locals
.cont.1769:
    ldr r0, [sp, locals@1]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@1]
    @stackempty locals
    b .fortop.1769      
.brk.1769:
    ldr r0, [sp, args@2]
.ret.212:
    @stackempty locals
.final_0_37:
    add sp, #4*2 ; pop locals 2
helpers_arrayReduce__P212_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(305,5): helpers.arraySlice
    ;
    .object helpers_arraySlice__P215 "core/pxt-helpers.ts(305,5): helpers.arraySlice"
helpers_arraySlice__P215_pre:
    .section code
    .balign 4
    .section code
helpers_arraySlice__P215:
helpers_arraySlice__P215_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
helpers_arraySlice__P215_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::mk
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@1]
    @stackempty locals
    ldr r0, [sp, args@1]
    movs r1, #0
    bl _cmp_eqq
    beq .else_0_38      
.jmpz195:
    movs r0, #1
    str r0, [sp, args@1]
    @stackempty locals
    b .afterif_1_38      
.else_0_38:
    ldr r0, [sp, args@1]
    movs r1, #1
    bl _cmp_lt
    beq .else_2_38      
.jmpz196:
    ldr r0, [sp, locals@1]
    ldr r1, [sp, args@1]
    bl _numops_adds
    mov r3, r0
    movs r0, #1
    push {r0} ; proc-arg
    push {r3} ; the one arg
    bl Math_max__P231
_proccall197:
    add sp, #4*2 ; pop locals 2
    str r0, [sp, args@1]
    @stackempty locals
.else_2_38:
.afterif_3_38:
.afterif_1_38:
    ldr r0, [sp, args@1]
    ldr r1, [sp, locals@1]
    bl _cmp_gt
    beq .else_4_38      
.jmpz198:
    ldr r0, [sp, locals@0]
    b .ret.215      
.else_4_38:
.afterif_5_38:
    ldr r0, [sp, args@2]
    movs r1, #0
    bl _cmp_eqq
    beq .else_6_38      
.jmpz199:
    ldr r0, [sp, locals@1]
    str r0, [sp, args@2]
    @stackempty locals
    b .afterif_7_38      
.else_6_38:
    ldr r0, [sp, args@2]
    movs r1, #1
    bl _cmp_lt
    beq .else_8_38      
.jmpz200:
    ldr r0, [sp, locals@1]
    ldr r1, [sp, args@2]
    bl _numops_adds
    str r0, [sp, args@2]
    @stackempty locals
.else_8_38:
.afterif_9_38:
.afterif_7_38:
    ldr r0, [sp, args@2]
    ldr r1, [sp, locals@1]
    bl _cmp_gt
    beq .else_10_38      
.jmpz201:
    ldr r0, [sp, locals@1]
    str r0, [sp, args@2]
    @stackempty locals
.else_10_38:
.afterif_11_38:
    ldr r0, [sp, args@1]
    str r0, [sp, locals@2]
    @stackempty locals
.fortop.1818:
    ldr r0, [sp, locals@2]
    ldr r1, [sp, args@2]
    bl _cmp_lt
    beq .brk.1818      
.jmpz202:
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    bl _conv_8
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::push
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.cont.1818:
    ldr r0, [sp, locals@2]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@2]
    @stackempty locals
    b .fortop.1818      
.brk.1818:
    ldr r0, [sp, locals@0]
.ret.215:
    @stackempty locals
.final_12_38:
    add sp, #4*3 ; pop locals 3
helpers_arraySlice__P215_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(159,5): helpers.arrayJoin
    ;
    .object helpers_arrayJoin__P201 "core/pxt-helpers.ts(159,5): helpers.arrayJoin"
helpers_arrayJoin__P201_pre:
    .section code
    .balign 4
    .section code
helpers_arrayJoin__P201:
helpers_arrayJoin__P201_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
helpers_arrayJoin__P201_locals:
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    movs r1, #0
    mov r7, sp
    str r7, [r6, #4]
    bl numops::eqq
    add sp, #4*1 ; pop locals 1
    push {r0}; tmpstore @1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBool
    cmp r0, #0
    beq .lazySkip_2_39      
.jmpz203:
    ldr r0, [sp, #4*0] ; tmpref @1
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .lazy_1_39      
.lazySkip_2_39:
    ldr r0, [sp, #0]      
    ldr r0, [sp, #4*0] ; estack
    add sp, #4*1 ; pop locals 1
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    movs r1, #6
    mov r7, sp
    str r7, [r6, #4]
    bl numops::eqq
    add sp, #4*1 ; pop locals 1
.lazy_1_39:
; jmp value (already in r0)
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_0_39      
.jmpz204:
    ldr r0, _ldlit_57 ; _str0      
    str r0, [sp, args@1]
    @stackempty locals
.else_0_39:
.afterif_3_39:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@1]
    @stackempty locals
    movs r0, #1
    str r0, [sp, locals@2]
    @stackempty locals
.fortop.1846:
    ldr r0, [sp, locals@2]
    ldr r1, [sp, locals@1]
    bl _cmp_lt
    bne .jmpz205
    b .brk.1846      
.jmpz205:
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    movs r1, #1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::gt
    add sp, #4*1 ; pop locals 1
    push {r0}; tmpstore @1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBool
    cmp r0, #0
    bne .lazySkip_6_39      
.jmpz206:
    ldr r0, [sp, #4*0] ; tmpref @1
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .lazy_5_39      
.lazySkip_6_39:
    ldr r0, [sp, #0]      
    ldr r0, [sp, #4*0] ; estack
    add sp, #4*1 ; pop locals 1
    ldr r0, [sp, args@1]
.lazy_5_39:
; jmp value (already in r0)
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_4_39      
.jmpz207:
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl _conv_6
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*2 ; pop locals 2
    str r0, [sp, locals@0]
    @stackempty locals
.else_4_39:
.afterif_7_39:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    movs r1, #0
    mov r7, sp
    str r7, [r6, #4]
    bl numops::eqq
    add sp, #4*1 ; pop locals 1
    push {r0}; tmpstore @1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBool
    cmp r0, #0
    beq .lazySkip_11_39      
.jmpz208:
    ldr r0, [sp, #4*0] ; tmpref @1
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .lazy_10_39      
.lazySkip_11_39:
    ldr r0, [sp, #0]      
    ldr r0, [sp, #4*0] ; estack
    add sp, #4*1 ; pop locals 1
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    movs r1, #6
    mov r7, sp
    str r7, [r6, #4]
    bl numops::eqq
    add sp, #4*1 ; pop locals 1
.lazy_10_39:
; jmp value (already in r0)
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .condexprz_8_39      
.jmpz209:
    mov r7, sp
    str r7, [r6, #4]
    bl String_::mkEmpty
    b .condexprfin_9_39      
.object PUSH
.balign 4
_ldlit_55:
 .word _str52
_ldlit_56:
 .word _str45
_ldlit_57:
 .word _str0
.object POP
.condexprz_8_39:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@2]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
.condexprfin_9_39:
; jmp value (already in r0)
    push {r0}; tmpstore @1
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; tmpref @1
    push {r0} ; proc-arg
    bl _conv_6
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*3 ; pop locals 3
    str r0, [sp, locals@0]
    @stackempty locals
.cont.1846:
    ldr r0, [sp, locals@2]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@2]
    @stackempty locals
    b .fortop.1846      
.brk.1846:
    ldr r0, [sp, locals@0]
.ret.201:
    @stackempty locals
.final_12_39:
    add sp, #4*3 ; pop locals 3
helpers_arrayJoin__P201_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/console.ts(56,5): console.log
    ;
    .object console_log__P436 "core/console.ts(56,5): console.log"
console_log__P436_pre:
    .section code
    .balign 4
    .section code
console_log__P436:
console_log__P436_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
console_log__P436_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    movs r0, #3
    push {r0} ; proc-arg
    bl console_add__P432
_proccall210:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.ret.436:
    @stackempty locals
    movs r0, #0
.final_0_40:
console_log__P436_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/console.ts(26,5): console.add
    ;
    .object console_add__P432 "core/console.ts(26,5): console.add"
console_add__P432_pre:
    .section code
    .balign 4
    .section code
console_add__P432:
console_add__P432_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
console_add__P432_locals:
    ldr r0, [sp, args@0]
    ldr r7, [r6, #0]
    ldr r1, [r7, #44]
    bl _cmp_lt
    beq .else_0_41      
.jmpz211:
    b .ret.432      
.else_0_41:
.afterif_1_41:
    movs r0, #41
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl console_inspect__P438
_proccall212:
    add sp, #4*2 ; pop locals 2
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl _conv_4
    ldr r1, _ldlit_59 ; _str44      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    bl _conv_21
    mov r7, sp
    str r7, [r6, #4]
    bl control::__log
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    ldr r7, [r6, #0]
    ldr r0, [r7, #48]
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_2_41      
.jmpz213:
    movs r0, #1
    str r0, [sp, locals@1]
    @stackempty locals
.fortop.1906:
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    ldr r7, [r6, #0]
    ldr r0, [r7, #48]
    push {r0} ; proc-arg
    bl _conv_11
    bl _pxt_array_length_tagged
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _cmp_lt
    add sp, #4*2 ; pop locals 2
    beq .brk.1906      
.jmpz214:
    ldr r7, [r6, #0]
    ldr r0, [r7, #48]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    bl _pxt_array_get
    add sp, #4*2 ; pop locals 2
    mov r3, r0
    push {r3} ; the one arg
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*2] ; estack
    bl _lambda_call2_13
    add sp, #4*3 ; pop locals 3
    @stackempty locals
.cont.1906:
    ldr r0, [sp, locals@1]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@1]
    @stackempty locals
    b .fortop.1906      
.brk.1906:
.else_2_41:
.afterif_3_41:
.ret.432:
    @stackempty locals
    movs r0, #0
.final_4_41:
    add sp, #4*2 ; pop locals 2
console_add__P432_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/input.ts(67,5): input.runningTime
    ;
    .object input_runningTime__P394 "core/input.ts(67,5): input.runningTime"
input_runningTime__P394_pre:
    .section code
    .balign 4
    .section code
input_runningTime__P394:
input_runningTime__P394_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
input_runningTime__P394_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl control::millis
    bl _numops_fromInt
.ret.394:
    @stackempty locals
.final_0_42:
input_runningTime__P394_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/motion.ts(344,5): diffDrive.whileMoving
    ;
    .object diffDrive_whileMoving__P978 "nezha-diffdrive/src/blocks/motion.ts(344,5): diffDrive.whileMoving"
diffDrive_whileMoving__P978_pre:
    .section code
    .balign 4
    .section code
diffDrive_whileMoving__P978:
diffDrive_whileMoving__P978_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_whileMoving__P978_locals:
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl diffDrive_startMove__P973
_proccall216:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.cont.1928:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::tickDrive
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .brk.1928      
.jmpz217:
    ldr r0, [sp, args@2]
    push {r0} ; proc-arg
    bl diffDrive_poseX__P932
_proccall218:
    push {r0} ; proc-arg
    bl diffDrive_poseY__P933
_proccall219:
    push {r0} ; proc-arg
    bl diffDrive_heading__P934
_proccall220:
    push {r0} ; proc-arg
    pop {r1, r2, r3, r4}
    push {r4}
    push {r1}
    push {r2}
    push {r3}
    ldr r0, [sp, #4*3] ; estack
    bl _lambda_call3_20
    add sp, #4*4 ; pop locals 4
    @stackempty locals
    b .cont.1928      
.brk.1928:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::endMove
    @stackempty locals
.ret.978:
    @stackempty locals
    movs r0, #0
.final_0_43:
diffDrive_whileMoving__P978_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/pose.ts(20,5): diffDrive.poseY
    ;
    .object diffDrive_poseY__P933 "nezha-diffdrive/src/blocks/pose.ts(20,5): diffDrive.poseY"
diffDrive_poseY__P933_pre:
    .section code
    .balign 4
    .section code
diffDrive_poseY__P933:
diffDrive_poseY__P933_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_poseY__P933_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::poseY
    bl _numops_fromInt
    push {r0} ; proc-arg
    movs r1, #21
    mov r7, sp
    str r7, [r6, #4]
    bl numops::div
    add sp, #4*1 ; pop locals 1
.ret.933:
    @stackempty locals
.final_0_44:
diffDrive_poseY__P933_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/pose.ts(10,5): diffDrive.poseX
    ;
    .object diffDrive_poseX__P932 "nezha-diffdrive/src/blocks/pose.ts(10,5): diffDrive.poseX"
diffDrive_poseX__P932_pre:
    .section code
    .balign 4
    .section code
diffDrive_poseX__P932:
diffDrive_poseX__P932_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_poseX__P932_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::poseX
    bl _numops_fromInt
    push {r0} ; proc-arg
    movs r1, #21
    mov r7, sp
    str r7, [r6, #4]
    bl numops::div
    add sp, #4*1 ; pop locals 1
.ret.932:
    @stackempty locals
.final_0_45:
diffDrive_poseX__P932_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/motion.ts(242,5): diffDrive.startMove
    ;
    .object diffDrive_startMove__P973 "nezha-diffdrive/src/blocks/motion.ts(242,5): diffDrive.startMove"
diffDrive_startMove__P973_pre:
    .section code
    .balign 4
    .section code
diffDrive_startMove__P973:
diffDrive_startMove__P973_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_startMove__P973_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    movs r1, #21
    mov r7, sp
    str r7, [r6, #4]
    bl numops::muls
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    movs r1, #201
    mov r7, sp
    str r7, [r6, #4]
    bl numops::muls
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r7, [r6, #0]
    ldr r0, [r7, #52]
    push {r0} ; proc-arg
    movs r1, #21
    mov r7, sp
    str r7, [r6, #4]
    bl numops::muls
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r7, [r6, #0]
    ldr r0, [r7, #56]
    push {r0} ; proc-arg
    movs r1, #201
    mov r7, sp
    str r7, [r6, #4]
    bl numops::muls
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    bl _conv_22
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::startMove
    add sp, #4*4 ; pop locals 4
    @stackempty locals
.ret.973:
    @stackempty locals
    movs r0, #0
.final_0_46:
diffDrive_startMove__P973_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function main.ts(7,1): driveSquare
    ;
    .object driveSquare__P1087 "main.ts(7,1): driveSquare"
driveSquare__P1087_pre:
    .section code
    .balign 4
    .section code
driveSquare__P1087:
driveSquare__P1087_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    @stackmark locals
driveSquare__P1087_locals:
    ldr r0, _ldlit_60 ; _str58      
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    @stackempty locals
    movs r0, #4
    lsls r0, r0, #8
    adds r0, #177
    push {r0} ; proc-arg
    movs r0, #13
    push {r0} ; proc-arg
    bl basic_showIcon__P383
_proccall222:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    bl diffDrive_resetPose__P935
_proccall223:
    @stackempty locals
    movs r0, #1
    str r0, [sp, locals@0]
    @stackempty locals
.fortop.1975:
    ldr r0, [sp, locals@0]
    movs r1, #9
    bl _cmp_lt
    beq .brk.1975      
.jmpz224:
    movs r0, #1
    push {r0} ; proc-arg
    movs r0, #61
    push {r0} ; proc-arg
    bl diffDrive_move__P971
_proccall225:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    movs r0, #181
    push {r0} ; proc-arg
    movs r0, #1
    push {r0} ; proc-arg
    bl diffDrive_move__P971
_proccall226:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.cont.1975:
    ldr r0, [sp, locals@0]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, locals@0]
    @stackempty locals
    b .fortop.1975      
.brk.1975:
    bl diffDrive_heading__P934
_proccall227:
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    mov r3, r0
    movs r0, #1
    lsls r0, r0, #8
    adds r0, #45
    push {r0} ; proc-arg
    push {r3} ; the one arg
    bl basic_showNumber__P380
_proccall228:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
    bl diffDrive_heading__P934
_proccall229:
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    bl _conv_3
    ldr r0, _ldlit_61 ; _str59      
    mov r7, sp
    str r7, [r6, #4]
    bl String_::concat
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    bl _conv_4
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::emitLine
    add sp, #4*1 ; pop locals 1
    @stackempty locals
.ret.1087:
    @stackempty locals
    movs r0, #0
.final_0_47:
    add sp, #4*1 ; pop locals 1
driveSquare__P1087_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/basic.ts(13,5): basic.showNumber
    ;
    .object basic_showNumber__P380 "core/basic.ts(13,5): basic.showNumber"
basic_showNumber__P380_pre:
    .section code
    .balign 4
    .section code
basic_showNumber__P380:
basic_showNumber__P380_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
basic_showNumber__P380_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl isNaN__P193
_proccall231:
    add sp, #4*1 ; pop locals 1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .else_0_48      
.jmpz230:
    ldr r0, _ldlit_62 ; _str1      
    movs r1, #150
    mov r7, sp
    str r7, [r6, #4]
    bl basic::showString
    @stackempty locals
    b .afterif_1_48      
.else_0_48:
    movs r0, #5
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl Math_roundWithPrecision__P233
_proccall232:
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toString
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl _conv_15
    mov r7, sp
    str r7, [r6, #4]
    bl basic::showString
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.afterif_1_48:
.ret.380:
    @stackempty locals
    movs r0, #0
.final_2_48:
basic_showNumber__P380_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/pxt-helpers.ts(581,5): Math.roundWithPrecision
    ;
    .object Math_roundWithPrecision__P233 "core/pxt-helpers.ts(581,5): Math.roundWithPrecision"
Math_roundWithPrecision__P233_pre:
    .section code
    .balign 4
    .section code
Math_roundWithPrecision__P233:
Math_roundWithPrecision__P233_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    push {r0} ;loc
    @stackmark locals
Math_roundWithPrecision__P233_locals:
    ldr r0, [sp, args@1]
    movs r1, #1
    bl _numops_orrs
    str r0, [sp, args@1]
    @stackempty locals
    ldr r0, [sp, args@1]
    movs r1, #1
    bl _cmp_le
    beq .else_0_49      
.jmpz233:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    b .ret.233      
    b .afterif_1_49      
.object PUSH
.balign 4
_ldlit_59:
 .word _str44
_ldlit_60:
 .word _str58
_ldlit_61:
 .word _str59
_ldlit_62:
 .word _str1
.object POP
.else_0_49:
.afterif_1_49:
    ldr r0, [sp, args@0]
    movs r1, #1
    bl _cmp_eq
    beq .else_2_49      
.jmpz234:
    movs r0, #1
    b .ret.233      
.else_2_49:
.afterif_3_49:
    movs r0, #1
    str r0, [sp, locals@0]
    @stackempty locals
.cont.2025:
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    ldr r1, [sp, #4*0] ; estack
    movs r0, #21
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::pow
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@1]
    @stackempty locals
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    mov r7, sp
    str r7, [r6, #4]
    bl numops::muls
    add sp, #4*2 ; pop locals 2
    push {r0} ; proc-arg
    mov r7, sp
    str r7, [r6, #4]
    bl Math_::round
    add sp, #4*1 ; pop locals 1
    push {r0} ; proc-arg
    ldr r0, [sp, locals@1]
    push {r0} ; proc-arg
    ldr r0, [sp, #4*1] ; estack
    ldr r1, [sp, #4*0] ; estack
    mov r7, sp
    str r7, [r6, #4]
    bl numops::div
    add sp, #4*2 ; pop locals 2
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, args@1]
    movs r1, #3
    bl _numops_adds
    str r0, [sp, args@1]
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    movs r1, #1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::eq
    add sp, #4*1 ; pop locals 1
    push {r0}; tmpstore @1
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBool
    cmp r0, #0
    bne .lazySkip_5_49      
.jmpz235:
    ldr r0, [sp, #4*0] ; tmpref @1
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .lazy_4_49      
.lazySkip_5_49:
    ldr r0, [sp, #0]      
    ldr r0, [sp, #4*0] ; estack
    add sp, #4*1 ; pop locals 1
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    movs r1, #43
    mov r7, sp
    str r7, [r6, #4]
    bl numops::lt
    add sp, #4*1 ; pop locals 1
.lazy_4_49:
; jmp value (already in r0)
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .brk.2025      
.jmpz236:
    b .cont.2025      
.brk.2025:
    ldr r0, [sp, locals@0]
.ret.233:
    @stackempty locals
.final_6_49:
    add sp, #4*2 ; pop locals 2
Math_roundWithPrecision__P233_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/motion.ts(210,5): diffDrive.move
    ;
    .object diffDrive_move__P971 "nezha-diffdrive/src/blocks/motion.ts(210,5): diffDrive.move"
diffDrive_move__P971_pre:
    .section code
    .balign 4
    .section code
diffDrive_move__P971:
diffDrive_move__P971_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_move__P971_locals:
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl diffDrive_startMove__P973
_proccall237:
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.cont.2058:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::tickDrive
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::fromBool
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toBoolDecr
    cmp r0, #0
    beq .brk.2058      
.jmpz238:
    b .cont.2058      
.brk.2058:
.ret.971:
    @stackempty locals
    movs r0, #0
.final_0_50:
diffDrive_move__P971_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function nezha-diffdrive/src/blocks/pose.ts(40,5): diffDrive.resetPose
    ;
    .object diffDrive_resetPose__P935 "nezha-diffdrive/src/blocks/pose.ts(40,5): diffDrive.resetPose"
diffDrive_resetPose__P935_pre:
    .section code
    .balign 4
    .section code
diffDrive_resetPose__P935:
diffDrive_resetPose__P935_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
diffDrive_resetPose__P935_locals:
    mov r7, sp
    str r7, [r6, #4]
    bl diffDrive::resetPose
    @stackempty locals
.ret.935:
    @stackempty locals
    movs r0, #0
.final_0_51:
diffDrive_resetPose__P935_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/icons.ts(190,5): basic.showIcon
    ;
    .object basic_showIcon__P383 "core/icons.ts(190,5): basic.showIcon"
basic_showIcon__P383_pre:
    .section code
    .balign 4
    .section code
basic_showIcon__P383:
basic_showIcon__P383_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    movs r0, #0
    push {r0} ;loc
    @stackmark locals
basic_showIcon__P383_locals:
    ldr r0, [sp, args@0]
    push {r0} ; proc-arg
    bl images_iconImage__P386
_proccall239:
    add sp, #4*1 ; pop locals 1
    str r0, [sp, locals@0]
    @stackempty locals
    ldr r0, [sp, locals@0]
    push {r0} ; proc-arg
    ldr r0, [sp, args@1]
    push {r0} ; proc-arg
    bl _conv_24
    movs r1, #0
    mov r7, sp
    str r7, [r6, #4]
    bl ImageMethods::showImage
    add sp, #4*2 ; pop locals 2
    @stackempty locals
.ret.383:
    @stackempty locals
    movs r0, #0
.final_0_52:
    add sp, #4*1 ; pop locals 1
basic_showIcon__P383_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    ;
; Function core/icons.ts(286,5): images.iconImage
    ;
    .object images_iconImage__P386 "core/icons.ts(286,5): images.iconImage"
images_iconImage__P386_pre:
    .section code
    .balign 4
    .section code
images_iconImage__P386:
images_iconImage__P386_nochk:
    @stackmark func
    @stackmark args
    push {lr}
.locals:
    @stackmark locals
images_iconImage__P386_locals:
    ldr r0, [sp, args@0]
    push {r0}; tmpstore @1
    mov r1, r0
    movs r0, #1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz240
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_0_53      
.jmpz240:
    movs r0, #3
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz241
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_1_53      
.jmpz241:
    movs r0, #9
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz242
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_2_53      
.jmpz242:
    movs r0, #11
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz243
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_3_53      
.jmpz243:
    movs r0, #13
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz244
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_4_53      
.jmpz244:
    movs r0, #15
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz245
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_5_53      
.jmpz245:
    movs r0, #17
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz246
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_6_53      
.jmpz246:
    movs r0, #19
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz247
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_7_53      
.jmpz247:
    movs r0, #21
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz248
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_8_53      
.jmpz248:
    movs r0, #23
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz249
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_9_53      
.jmpz249:
    movs r0, #25
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz250
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_10_53      
.jmpz250:
    movs r0, #5
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz251
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_11_53      
.jmpz251:
    movs r0, #7
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz252
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_12_53      
.jmpz252:
    movs r0, #67
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz253
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_13_53      
.jmpz253:
    movs r0, #69
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz254
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_14_53      
.jmpz254:
    movs r0, #71
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz255
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_15_53      
.jmpz255:
    movs r0, #73
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz256
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_16_53      
.jmpz256:
    movs r0, #75
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz257
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_17_53      
.jmpz257:
    movs r0, #77
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz258
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_18_53      
.jmpz258:
    movs r0, #79
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz259
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_19_53      
.jmpz259:
    movs r0, #81
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz260
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_20_53      
.jmpz260:
    movs r0, #27
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz261
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_21_53      
.jmpz261:
    movs r0, #29
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz262
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_22_53      
.jmpz262:
    movs r0, #31
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz263
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_23_53      
.jmpz263:
    movs r0, #33
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz264
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_24_53      
.jmpz264:
    movs r0, #35
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz265
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_25_53      
.jmpz265:
    movs r0, #37
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz266
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_26_53      
.jmpz266:
    movs r0, #39
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz267
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_27_53      
.jmpz267:
    movs r0, #41
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz268
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_28_53      
.jmpz268:
    movs r0, #43
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz269
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_29_53      
.jmpz269:
    movs r0, #45
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz270
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_30_53      
.jmpz270:
    movs r0, #47
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz271
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_31_53      
.jmpz271:
    movs r0, #49
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz272
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_32_53      
.jmpz272:
    movs r0, #51
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz273
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_33_53      
.jmpz273:
    movs r0, #53
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz274
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_34_53      
.jmpz274:
    movs r0, #55
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz275
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_35_53      
.jmpz275:
    movs r0, #57
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz276
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_36_53      
.jmpz276:
    movs r0, #61
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz277
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_37_53      
.jmpz277:
    movs r0, #59
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz278
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_38_53      
.jmpz278:
    movs r0, #63
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz279
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_39_53      
.jmpz279:
    movs r0, #65
    ldr r1, [sp, #4*0] ; tmpref @1
    bl _pxt_switch_eq
    cmp r0, #0
    beq .jmpz280
    @dummystack 1
    add sp, #4*1 ; pop locals 1
    b .switch_40_53      
.jmpz280:
    pop {r0} ; tmpref @1
    b .switch_41_53      
.switch_0_53:
    ldr r0, _ldlit_64 ; _img2      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_1_53:
    ldr r0, _ldlit_65 ; _img3      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_2_53:
    ldr r0, _ldlit_66 ; _img4      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_3_53:
    ldr r0, _ldlit_67 ; _img5      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_4_53:
    ldr r0, _ldlit_68 ; _img6      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_5_53:
    ldr r0, _ldlit_69 ; _img7      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_6_53:
    ldr r0, _ldlit_70 ; _img8      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_7_53:
    ldr r0, _ldlit_71 ; _img9      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_8_53:
    ldr r0, _ldlit_72 ; _img10      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_9_53:
    ldr r0, _ldlit_73 ; _img11      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_10_53:
    ldr r0, _ldlit_74 ; _img12      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_11_53:
    ldr r0, _ldlit_75 ; _img13      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_12_53:
    ldr r0, _ldlit_76 ; _img14      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_13_53:
    ldr r0, _ldlit_77 ; _img15      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_14_53:
    ldr r0, _ldlit_78 ; _img16      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_15_53:
    ldr r0, _ldlit_79 ; _img17      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_16_53:
    ldr r0, _ldlit_80 ; _img18      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_17_53:
    ldr r0, _ldlit_81 ; _img19      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_18_53:
    ldr r0, _ldlit_82 ; _img20      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_19_53:
    ldr r0, _ldlit_83 ; _img21      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_20_53:
    ldr r0, _ldlit_84 ; _img22      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_21_53:
    ldr r0, _ldlit_85 ; _img23      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_22_53:
    ldr r0, _ldlit_86 ; _img24      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_23_53:
    ldr r0, _ldlit_87 ; _img25      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_24_53:
    ldr r0, _ldlit_88 ; _img26      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_25_53:
    ldr r0, _ldlit_89 ; _img27      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_26_53:
    ldr r0, _ldlit_90 ; _img28      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_27_53:
    ldr r0, _ldlit_91 ; _img29      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_28_53:
    ldr r0, _ldlit_92 ; _img30      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_29_53:
    ldr r0, _ldlit_93 ; _img31      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_30_53:
    ldr r0, _ldlit_94 ; _img32      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_31_53:
    ldr r0, _ldlit_95 ; _img33      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_32_53:
    ldr r0, _ldlit_96 ; _img34      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_33_53:
    ldr r0, _ldlit_97 ; _img35      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_34_53:
    ldr r0, _ldlit_98 ; _img36      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_35_53:
    ldr r0, _ldlit_99 ; _img37      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_36_53:
    ldr r0, _ldlit_100 ; _img38      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_37_53:
    ldr r0, _ldlit_101 ; _img39      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_38_53:
    ldr r0, _ldlit_102 ; _img40      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_39_53:
    ldr r0, _ldlit_103 ; _img41      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.object PUSH
.balign 4
_ldlit_64:
 .word _img2
_ldlit_65:
 .word _img3
_ldlit_66:
 .word _img4
_ldlit_67:
 .word _img5
_ldlit_68:
 .word _img6
_ldlit_69:
 .word _img7
_ldlit_70:
 .word _img8
_ldlit_71:
 .word _img9
_ldlit_72:
 .word _img10
_ldlit_73:
 .word _img11
_ldlit_74:
 .word _img12
_ldlit_75:
 .word _img13
_ldlit_76:
 .word _img14
_ldlit_77:
 .word _img15
_ldlit_78:
 .word _img16
_ldlit_79:
 .word _img17
_ldlit_80:
 .word _img18
_ldlit_81:
 .word _img19
_ldlit_82:
 .word _img20
_ldlit_83:
 .word _img21
_ldlit_84:
 .word _img22
_ldlit_85:
 .word _img23
_ldlit_86:
 .word _img24
_ldlit_87:
 .word _img25
_ldlit_88:
 .word _img26
_ldlit_89:
 .word _img27
_ldlit_90:
 .word _img28
_ldlit_91:
 .word _img29
_ldlit_92:
 .word _img30
_ldlit_93:
 .word _img31
_ldlit_94:
 .word _img32
_ldlit_95:
 .word _img33
_ldlit_96:
 .word _img34
_ldlit_97:
 .word _img35
_ldlit_98:
 .word _img36
_ldlit_99:
 .word _img37
_ldlit_100:
 .word _img38
_ldlit_101:
 .word _img39
_ldlit_102:
 .word _img40
_ldlit_103:
 .word _img41
.object POP
.switch_40_53:
    ldr r0, _ldlit_105 ; _img42      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.switch_41_53:
    ldr r0, _ldlit_106 ; _img43      
    mov r7, sp
    str r7, [r6, #4]
    bl images::createImage
    b .ret.386      
.brk.2074:
    movs r0, #0
.ret.386:
    @stackempty locals
.final_42_53:
images_iconImage__P386_end:
    pop {pc}
    @stackempty func
    @stackempty args
; endfun
    .object _pxt_helper_trampoline "helper: trampoline"
    .section code
_pxt_lambda_trampoline:
    push { r4, r5, r6, r7, lr}
    mov r4, r8
    mov r5, r9
    mov r6, r10
    mov r7, r11
    push {r4, r5, r6, r7} ; save high registers
    mov r4, r1
    mov r5, r2
    mov r6, r3
    mov r7, r0
    bl _inst_builtin4_validate_0
    mov r0, sp
    push {r4, r5, r6, r7} ; push args and the lambda
    mov r1, sp
    bl pxt::pushThreadContext
    mov r6, r0          ; save ctx or globals
    mov r5, r7          ; save lambda for closure
    mov r0, r5          ; also save lambda pointer in r0 - needed by pxt::bindMethod
    ldr r1, [r5, #8]    ; ld fnptr
    movs r4, #3         ; 3 args
    blx r1              ; execute the actual lambda
    mov r7, r0          ; save result
    @dummystack 4
    add sp, #4*4        ; remove arguments and lambda
    mov r0, r6   ; or pop the thread context
    bl pxt::popThreadContext
    mov r0, r7 ; restore result
    pop {r4, r5, r6, r7} ; restore high registers
    mov r8, r4
    mov r9, r5
    mov r10, r6
    mov r11, r7
    pop { r4, r5, r6, r7, pc}
    .object _pxt_helper_exn "helper: exn"
    .section code
; r0 - try frame
; r1 - handler PC
_pxt_save_exception_state:
    push {r0, lr}
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::beginTry
    pop {r1, r4}
    str r1, [r0, #1*4] ; PC
    mov r1, sp
    str r1, [r0, #2*4] ; SP
    str r5, [r0, #3*4] ; lambda ptr
    bx r4
    .section code
; r0 - try frame
; r1 - thread context
_pxt_restore_exception_state:
    mov r6, r1
    ldr r1, [r0, #2*4] ; SP
    mov sp, r1
    ldr r5, [r0, #3*4] ; lambda ptr
    ldr r1, [r0, #1*4] ; PC
    movs r0, #1
    orrs r1, r0
    bx r1
    .object _pxt_helper_stringconv "helper: stringconv"
    .section code
_pxt_stringConv:
    lsls r2, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r2, [r3, #8]
    cmp r2, #1
    bne .notstring
    bx lr
.notstring:
    ldr r7, [r3, #4*8]
    cmp r7, #0
    beq .fail
    push {r0, lr}
    movs r4, #1
    blx r7
    str r0, [sp, #0]
    b .numops
.fail:
    push {r0, lr}
.numops:
    mov r7, sp
    str r7, [r6, #4]
    bl numops::toString
    pop {r1, pc}      
    .object _pxt_helper_get_buffer "helper: get buffer"
    .section code
_pxt_buffer_get:
    lsls r4, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r4, [r3, #8]
    cmp r4, #3
    bne .fail
    asrs r1, r1, #1
    bcc .notint
    ldr r4, [r0, #4]
    cmp r1, r4
    bhs .oob
    adds r4, r0, r1
    ldrb r0, [r4, #8]
    lsls r0, r0, #1
    adds r0, #1
    bx lr
.notint:
    lsls r1, r1, #1
    push {lr, r0, r2}      
    mov r0, r1
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::toInt
    mov r1, r0
    pop {r0, r2}
.doop:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::getAt
    lsls r0, r0, #1
    adds r0, #1
    pop {pc}
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
.oob:
    movs r0, #1 ; 0 or undefined
    bx lr
    .object _pxt_helper_get_array "helper: get array"
    .section code
_pxt_array_get:
    lsls r4, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r4, [r3, #8]
    cmp r4, #6
    bne .fail
    asrs r1, r1, #1
    bcc .notint
    ldrh r4, [r0, #8]
    cmp r1, r4
    bhs .oob
    lsls r1, r1, #2
    ldr r4, [r0, #4]
    ldr r0, [r4, r1]
    bx lr
.notint:
    lsls r1, r1, #1
    push {lr, r0, r2}      
    mov r0, r1
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::toInt
    mov r1, r0
    pop {r0, r2}
.doop:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::getAt
    pop {pc}
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
.oob:
    movs r0, #0 ; 0 or undefined
    bx lr
    .object _pxt_helper_set_buffer "helper: set buffer"
    .section code
_pxt_buffer_set:
    lsls r4, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r4, [r3, #8]
    cmp r4, #3
    bne .fail
    asrs r1, r1, #1
    bcc .notint
    ldr r4, [r0, #4]
    cmp r1, r4
    bhs .oob
    adds r4, r0, r1
    strb r2, [r4, #8]
    bx lr
.notint:
    lsls r1, r1, #1
    push {lr, r0, r2}      
    mov r0, r1
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::toInt
    mov r1, r0
    pop {r0, r2}
.doop:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::setAt
    pop {pc}
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
.oob:
    push {lr}
    b .doop
    .object _pxt_helper_set_array "helper: set array"
    .section code
_pxt_array_set:
    lsls r4, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r4, [r3, #8]
    cmp r4, #6
    bne .fail
    asrs r1, r1, #1
    bcc .notint
    ldrh r4, [r0, #8]
    cmp r1, r4
    bhs .oob
    lsls r1, r1, #2
    ldr r4, [r0, #4]
    str r2, [r4, r1]
    bx lr
.notint:
    lsls r1, r1, #1
    push {lr, r0, r2}      
    mov r0, r1
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::toInt
    mov r1, r0
    pop {r0, r2}
.doop:
    mov r7, sp
    str r7, [r6, #4]
    bl Array_::setAt
    pop {pc}
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
.oob:
    push {lr}
    b .doop
    .object _pxt_helper_get "helper: get"
    .section code
_pxt_map_get:
    lsls r4, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r4, [r3, #8]
    cmp r4, #8
    bne .notmap
    push {lr}
    mov r7, sp
    str r7, [r6, #4]
    bl pxtrt::mapGetByString
    pop {pc}
.notmap:
    mov r4, r3 ; save VT
    push {r0, lr}
    mov r0, r1
    bl pxtrt::lookupMapKey
    mov r1, r0 ; put key index in r1
    ldr r0, [sp, #0] ; restore obj pointer
    mov r3, r4 ; restore vt
    bl .dowork
    add sp, #4*1 ; pop locals 1
    pop {pc}
.dowork:
    ldr r2, [r3, #12] ; load mult
    movs r7, r2
    beq .objlit ; built-in types have mult=0
    muls r7, r1
    lsrs r7, r2
    lsls r7, r7, #1 ; r7 - hash offset
    ldr r3, [r3, #4] ; iface table
    adds r3, r3, r7
; r0-this, r1-method idx, r2-free, r3-hash entry, r4-num args, r7-free
    ldrh r2, [r3, #0] ; r2-offset of descriptor
    ldrh r7, [r2, r3] ; r7-method idx
    cmp r7, r1
    beq .hit
    adds r3, #2
    ldrh r2, [r3, #0] ; r2-offset of descriptor
    ldrh r7, [r2, r3] ; r7-method idx
    cmp r7, r1
    beq .hit
    adds r3, #2
    ldrh r2, [r3, #0] ; r2-offset of descriptor
    ldrh r7, [r2, r3] ; r7-method idx
    cmp r7, r1
    beq .hit
    movs r0, #0 ; undefined
    bx lr
.hit:
    adds r3, r3, r2 ; r3-descriptor
    ldr r2, [r3, #4]
    lsls r7, r2, #31
    beq .field
; check if it's getter
    ldrh r7, [r3, #2]
    cmp r7, #1
    bne .bind
    movs r4, #1
    bx r2
.bind:
    mov r4, lr
    bl _pxt_bind_helper
.field:
    ldr r0, [r0, r2] ; load field
    bx lr
.objlit:
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
.fail2:
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::missingProperty
    .object _pxt_helper_set "helper: set"
    .section code
_pxt_map_set:
    lsls r4, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r4, [r3, #8]
    cmp r4, #8
    bne .notmap
    push {lr}
    mov r7, sp
    str r7, [r6, #4]
    bl pxtrt::mapSetByString
    pop {pc}
.notmap:
    mov r4, r3 ; save VT
    push {r0, r2, lr}
    mov r0, r1
    bl pxtrt::lookupMapKey
    mov r1, r0 ; put key index in r1
    ldr r0, [sp, #0] ; restore obj pointer
    mov r3, r4 ; restore vt
    bl .dowork
    add sp, #4*2 ; pop locals 2
    pop {pc}
.dowork:
    ldr r2, [r3, #12] ; load mult
    movs r7, r2
    beq .objlit ; built-in types have mult=0
    muls r7, r1
    lsrs r7, r2
    lsls r7, r7, #1 ; r7 - hash offset
    ldr r3, [r3, #4] ; iface table
    adds r3, r3, r7
; r0-this, r1-method idx, r2-free, r3-hash entry, r4-num args, r7-free
    ldrh r2, [r3, #0] ; r2-offset of descriptor
    ldrh r7, [r2, r3] ; r7-method idx
    cmp r7, r1
    beq .hit
    adds r3, #2
    ldrh r2, [r3, #0] ; r2-offset of descriptor
    ldrh r7, [r2, r3] ; r7-method idx
    cmp r7, r1
    beq .hit
    adds r3, #2
    ldrh r2, [r3, #0] ; r2-offset of descriptor
    ldrh r7, [r2, r3] ; r7-method idx
    cmp r7, r1
    beq .hit
    b .fail2
.object PUSH
.balign 4
_ldlit_105:
 .word _img42
_ldlit_106:
 .word _img43
.object POP
.hit:
    adds r3, r3, r2 ; r3-descriptor
    ldr r2, [r3, #4]
    lsls r7, r2, #31
    beq .field
; check for next descriptor
    ldrh r7, [r3, #8]
    cmp r7, r1
    bne .fail2 ; no setter!
    ldr r2, [r3, #12]
    movs r4, #2
    bx r2
.field:
    ldr r3, [sp, #4] ; ld-val
    str r3, [r0, r2] ; store field
    bx lr
.objlit:
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
.fail2:
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::missingProperty
    .object _pxt_helper_bind "helper: bind"
    .section code
_pxt_bind_helper:
    push {r0, r2}
    movs r0, #2
    ldr r1, _ldlit_108 ; _pxt_bind_lit      
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::mkAction
    pop {r1, r2}
    str r1, [r0, #12]
    str r2, [r0, #16]
    bx r4 ; return
_pxt_bind_lit:
    .word pxt::RefAction_vtable
    .short 0, 0 ; no captured vars
    .word .bindCode@fn
.bindCode:
; r0-bind object, r4-#args
    cmp r4, #12
    bge .fail
    lsls r3, r4, #2
    ldr r2, _ldlit_109 ; _pxt_copy_list      
    ldr r1, [r2, r3]
    ldr r3, [r0, #12]
    ldr r2, [r0, #16]
    adds r4, r4, #1
    bx r1
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
_pxt_copy_list:
    .word _pxt_bind_0@fn
    .word _pxt_bind_1@fn
    .word _pxt_bind_2@fn
    .word _pxt_bind_3@fn
    .word _pxt_bind_4@fn
    .word _pxt_bind_5@fn
    .word _pxt_bind_6@fn
    .word _pxt_bind_7@fn
    .word _pxt_bind_8@fn
    .word _pxt_bind_9@fn
    .word _pxt_bind_10@fn
    .word _pxt_bind_11@fn
_pxt_bind_0:
    sub sp, #4
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*1] ; store LR
    blx r2
    ldr r1, [sp, #4*1]
    add sp, #8
    bx r1
_pxt_bind_1:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*2] ; store LR
    blx r2
    ldr r1, [sp, #4*2]
    add sp, #8
    bx r1
_pxt_bind_2:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*3] ; store LR
    blx r2
    ldr r1, [sp, #4*3]
    add sp, #8
    bx r1
_pxt_bind_3:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*4] ; store LR
    blx r2
    ldr r1, [sp, #4*4]
    add sp, #8
    bx r1
_pxt_bind_4:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*3]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*5] ; store LR
    blx r2
    ldr r1, [sp, #4*5]
    add sp, #8
    bx r1
_pxt_bind_5:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*3]
    ldr r1, [sp, #4*5]
    str r1, [sp, #4*4]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*6] ; store LR
    blx r2
    ldr r1, [sp, #4*6]
    add sp, #8
    bx r1
_pxt_bind_6:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*3]
    ldr r1, [sp, #4*5]
    str r1, [sp, #4*4]
    ldr r1, [sp, #4*6]
    str r1, [sp, #4*5]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*7] ; store LR
    blx r2
    ldr r1, [sp, #4*7]
    add sp, #8
    bx r1
_pxt_bind_7:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*3]
    ldr r1, [sp, #4*5]
    str r1, [sp, #4*4]
    ldr r1, [sp, #4*6]
    str r1, [sp, #4*5]
    ldr r1, [sp, #4*7]
    str r1, [sp, #4*6]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*8] ; store LR
    blx r2
    ldr r1, [sp, #4*8]
    add sp, #8
    bx r1
_pxt_bind_8:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*3]
    ldr r1, [sp, #4*5]
    str r1, [sp, #4*4]
    ldr r1, [sp, #4*6]
    str r1, [sp, #4*5]
    ldr r1, [sp, #4*7]
    str r1, [sp, #4*6]
    ldr r1, [sp, #4*8]
    str r1, [sp, #4*7]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*9] ; store LR
    blx r2
    ldr r1, [sp, #4*9]
    add sp, #8
    bx r1
_pxt_bind_9:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*3]
    ldr r1, [sp, #4*5]
    str r1, [sp, #4*4]
    ldr r1, [sp, #4*6]
    str r1, [sp, #4*5]
    ldr r1, [sp, #4*7]
    str r1, [sp, #4*6]
    ldr r1, [sp, #4*8]
    str r1, [sp, #4*7]
    ldr r1, [sp, #4*9]
    str r1, [sp, #4*8]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*10] ; store LR
    blx r2
    ldr r1, [sp, #4*10]
    add sp, #8
    bx r1
_pxt_bind_10:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*3]
    ldr r1, [sp, #4*5]
    str r1, [sp, #4*4]
    ldr r1, [sp, #4*6]
    str r1, [sp, #4*5]
    ldr r1, [sp, #4*7]
    str r1, [sp, #4*6]
    ldr r1, [sp, #4*8]
    str r1, [sp, #4*7]
    ldr r1, [sp, #4*9]
    str r1, [sp, #4*8]
    ldr r1, [sp, #4*10]
    str r1, [sp, #4*9]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*11] ; store LR
    blx r2
    ldr r1, [sp, #4*11]
    add sp, #8
    bx r1
_pxt_bind_11:
    sub sp, #4
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*3]
    ldr r1, [sp, #4*5]
    str r1, [sp, #4*4]
    ldr r1, [sp, #4*6]
    str r1, [sp, #4*5]
    ldr r1, [sp, #4*7]
    str r1, [sp, #4*6]
    ldr r1, [sp, #4*8]
    str r1, [sp, #4*7]
    ldr r1, [sp, #4*9]
    str r1, [sp, #4*8]
    ldr r1, [sp, #4*10]
    str r1, [sp, #4*9]
    ldr r1, [sp, #4*11]
    str r1, [sp, #4*10]
    push {r3} ; this-ptr
    mov r1, lr
    str r1, [sp, #4*12] ; store LR
    blx r2
    ldr r1, [sp, #4*12]
    add sp, #8
    bx r1
_code_end:
    .section code
    .object _code_helper__inst_builtin4_validate_0
_inst_builtin4_validate_0:
    lsls r2, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r2, [r3, #8]
    cmp r2, #4
    bne .fail
    bx lr
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
    .section code
    .object _code_helper__conv_1
_conv_1:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*1] ; estack
    bl _inst_builtin4_validate_0
    mov r1, r0      
    pop {pc}
    @stackempty args
    .section code
    .object _code_helper__expand_args_1_2
_expand_args_1_2:
    movs r0, #0
    movs r1, #0
    push {r0}
    bx lr
    .section code
    .object _code_helper__conv_3
_conv_3:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*1] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*1] ; estack
    mov r1, r0      
    pop {pc}
    @stackempty args
    .section code
    .object _code_helper__conv_4
_conv_4:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*1] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*1] ; estack
    pop {pc}
    @stackempty args
    .section code
    .object _code_helper__expand_args_2_5
_expand_args_2_5:
    movs r0, #0
    movs r1, #0
    push {r0}
    cmp r4, #1
    blt .zero1
    ldr r0, [sp, #2*4]
    str r1, [sp, #2*4] ; clear existing
.zero1:
    push {r0}
    bx lr
    .section code
    .object _code_helper__conv_6
_conv_6:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*2] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*2] ; estack
    push {r0}
    ldr r0, [sp, #4*2] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*2] ; estack
    mov r1, r0      
    pop {r0, pc}      
    @stackempty args
    .section code
    .object _code_helper__inst_builtin6_validate_7
_inst_builtin6_validate_7:
    lsls r2, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r2, [r3, #8]
    cmp r2, #6
    bne .fail
    bx lr
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
    .section code
    .object _code_helper__conv_8
_conv_8:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*2] ; estack
    bl _inst_builtin6_validate_7
    ldr r1, [sp, #4*1] ; estack
    pop {pc}
    @stackempty args
    .section code
    .object _code_helper__conv_9
_conv_9:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*1] ; estack
    bl _inst_builtin4_validate_0
    mov r2, r0      
    pop {pc}
    @stackempty args
    .section code
    .object _code_helper__conv_10
_conv_10:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*1] ; estack
    asrs r0, r0, #1
    bcs .isint1
    lsls r0, r0, #1
    bl _numops_toInt
.isint1:
    pop {pc}
    @stackempty args
    .section code
    .object _code_helper__conv_11
_conv_11:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*1] ; estack
    bl _inst_builtin6_validate_7
    pop {pc}
.object PUSH
.balign 4
_ldlit_108:
 .word _pxt_bind_lit
_ldlit_109:
 .word _pxt_copy_list
.object POP
    @stackempty args
    .section code
    .object _code_helper__lambda_call1_12
_lambda_call1_12:
; lambda call
    lsls r2, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r2, [r3, #8]
    cmp r2, #4
    bne .fail
    movs r4, #1
    ldrh r1, [r0, #4]
    cmp r1, #0
    bne .pushR5
    ldr r1, [r0, #8]
    bx r1 ; keep lr from the caller
.pushR5:
    sub sp, #8
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*0]
    str r5, [sp, #4*1]
    mov r1, lr
    str r1, [sp, #4*2]
    mov r5, r0
    ldr r7, [r5, #8]
    blx r7 ; exec actual lambda
    ldr r4, [sp, #4*2] ; restore what was in LR
    ldr r5, [sp, #4*1] ; restore lambda ctx
    ldr r1, [sp, #4*0]
    str r1, [sp, #4*2]
    add sp, #8
    bx r4
; end lambda call
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
    .section code
    .object _code_helper__lambda_call2_13
_lambda_call2_13:
; lambda call
    lsls r2, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r2, [r3, #8]
    cmp r2, #4
    bne .fail
    movs r4, #2
    ldrh r1, [r0, #4]
    cmp r1, #0
    bne .pushR5
    ldr r1, [r0, #8]
    bx r1 ; keep lr from the caller
.pushR5:
    sub sp, #8
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*1]
    str r5, [sp, #4*2]
    mov r1, lr
    str r1, [sp, #4*3]
    mov r5, r0
    ldr r7, [r5, #8]
    blx r7 ; exec actual lambda
    ldr r4, [sp, #4*3] ; restore what was in LR
    ldr r5, [sp, #4*2] ; restore lambda ctx
    ldr r1, [sp, #4*0]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*3]
    add sp, #8
    bx r4
; end lambda call
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
    .section code
    .object _code_helper__conv_14
_conv_14:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*3] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*3] ; estack
    push {r0}
    ldr r0, [sp, #4*3] ; estack
    asrs r0, r0, #1
    bcs .isint2
    lsls r0, r0, #1
    bl _numops_toInt
.isint2:
    push {r0}
    ldr r0, [sp, #4*3] ; estack
    asrs r0, r0, #1
    bcs .isint3
    lsls r0, r0, #1
    bl _numops_toInt
.isint3:
    mov r2, r0      
    pop {r1}
    pop {r0, pc}      
    @stackempty args
    .section code
    .object _code_helper__conv_15
_conv_15:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*2] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*2] ; estack
    push {r0}
    ldr r0, [sp, #4*2] ; estack
    asrs r0, r0, #1
    bcs .isint2
    lsls r0, r0, #1
    bl _numops_toInt
.isint2:
    mov r1, r0      
    pop {r0, pc}      
    @stackempty args
    .section code
    .object _code_helper__expand_args_3_16
_expand_args_3_16:
    movs r0, #0
    movs r1, #0
    push {r0}
    cmp r4, #2
    blt .zero2
    ldr r0, [sp, #3*4]
    str r1, [sp, #3*4] ; clear existing
.zero2:
    push {r0}
    cmp r4, #1
    blt .zero1
    ldr r0, [sp, #3*4]
    str r1, [sp, #3*4] ; clear existing
.zero1:
    push {r0}
    bx lr
    .section code
    .object _code_helper__conv_17
_conv_17:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*2] ; estack
    asrs r0, r0, #1
    bcs .isint1
    lsls r0, r0, #1
    bl _numops_toInt
.isint1:
    push {r0}
    ldr r0, [sp, #4*2] ; estack
    asrs r0, r0, #1
    bcs .isint2
    lsls r0, r0, #1
    bl _numops_toInt
.isint2:
    mov r1, r0      
    pop {r0, pc}      
    @stackempty args
    .section code
    .object _code_helper__conv_18
_conv_18:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*1] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*1] ; estack
    mov r1, r0      
    ldr r0, [sp, #4*2] ; estack
    pop {pc}
    @stackempty args
    .section code
    .object _code_helper__conv_19
_conv_19:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*2] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*2] ; estack
    ldr r1, [sp, #4*1] ; estack
    pop {pc}
    @stackempty args
    .section code
    .object _code_helper__lambda_call3_20
_lambda_call3_20:
; lambda call
    lsls r2, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r2, [r3, #8]
    cmp r2, #4
    bne .fail
    movs r4, #3
    ldrh r1, [r0, #4]
    cmp r1, #0
    bne .pushR5
    ldr r1, [r0, #8]
    bx r1 ; keep lr from the caller
.pushR5:
    sub sp, #8
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*0]
    ldr r1, [sp, #4*3]
    str r1, [sp, #4*1]
    ldr r1, [sp, #4*4]
    str r1, [sp, #4*2]
    str r5, [sp, #4*3]
    mov r1, lr
    str r1, [sp, #4*4]
    mov r5, r0
    ldr r7, [r5, #8]
    blx r7 ; exec actual lambda
    ldr r4, [sp, #4*4] ; restore what was in LR
    ldr r5, [sp, #4*3] ; restore lambda ctx
    ldr r1, [sp, #4*0]
    str r1, [sp, #4*2]
    ldr r1, [sp, #4*1]
    str r1, [sp, #4*3]
    ldr r1, [sp, #4*2]
    str r1, [sp, #4*4]
    add sp, #8
    bx r4
; end lambda call
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
    .section code
    .object _code_helper__conv_21
_conv_21:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*2] ; estack
    asrs r0, r0, #1
    bcs .isint1
    lsls r0, r0, #1
    bl _numops_toInt
.isint1:
    push {r0}
    ldr r0, [sp, #4*2] ; estack
    bl _pxt_stringConv
    str r0, [sp, #4*2] ; estack
    mov r1, r0      
    pop {r0, pc}      
    @stackempty args
    .section code
    .object _code_helper__conv_22
_conv_22:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*4] ; estack
    asrs r0, r0, #1
    bcs .isint1
    lsls r0, r0, #1
    bl _numops_toInt
.isint1:
    push {r0}
    ldr r0, [sp, #4*4] ; estack
    asrs r0, r0, #1
    bcs .isint2
    lsls r0, r0, #1
    bl _numops_toInt
.isint2:
    push {r0}
    ldr r0, [sp, #4*4] ; estack
    asrs r0, r0, #1
    bcs .isint3
    lsls r0, r0, #1
    bl _numops_toInt
.isint3:
    push {r0}
    ldr r0, [sp, #4*4] ; estack
    asrs r0, r0, #1
    bcs .isint4
    lsls r0, r0, #1
    bl _numops_toInt
.isint4:
    mov r3, r0      
    pop {r2}
    pop {r1}
    pop {r0, pc}      
    @stackempty args
    .section code
    .object _code_helper__inst_builtin9_validate_23
_inst_builtin9_validate_23:
    lsls r2, r0, #30
    bne .fail
    cmp r0, #0
    beq .fail
    ldr r3, [r0, #0]
; vtable in R3
    ldrh r2, [r3, #8]
    cmp r2, #9
    bne .fail
    bx lr
.fail:
    mov r1, lr
    mov r7, sp
    str r7, [r6, #4]
    bl pxt::failedCast
    .section code
    .object _code_helper__conv_24
_conv_24:
    @stackmark args
    push {lr}
    ldr r0, [sp, #4*2] ; estack
    bl _inst_builtin9_validate_23
    push {r0}
    ldr r0, [sp, #4*2] ; estack
    asrs r0, r0, #1
    bcs .isint2
    lsls r0, r0, #1
    bl _numops_toInt
.isint2:
    mov r2, r0      
    pop {r0, pc}      
    @stackempty args
_numops_adds:
    @scope _numops_adds
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r2, r1, #1
    adds r2, r0, r2
    bvs .boxed
    movs r0, r2
    blx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl numops::adds
                    add sp, #8
                    pop {pc}
_numops_subs:
    @scope _numops_subs
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r2, r1, #1
    subs r2, r0, r2
    bvs .boxed
    movs r0, r2
    blx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl numops::subs
                    add sp, #8
                    pop {pc}
_numops_ands:
    @scope _numops_ands
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    ands r0, r1
    blx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl numops::ands
                    add sp, #8
                    pop {pc}
_numops_orrs:
    @scope _numops_orrs
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    orrs r0, r1
    blx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl numops::orrs
                    add sp, #8
                    pop {pc}
_numops_eors:
    @scope _numops_eors
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    eors r0, r1
    adds r0, r0, #1
    blx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl numops::eors
                    add sp, #8
                    pop {pc}
_numops_lsls:
    @scope _numops_lsls
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    ; r3 := (r1 >> 1) & 0x1f
    lsls r3, r1, #26
    lsrs r3, r3, #27
    asrs r2, r0, #1
    lsls r2, r3
    lsrs r3, r2, #30
    beq .ok
    cmp r3, #3
    bne .boxed
.ok:
    lsls r0, r2, #1
    adds r0, r0, #1
    blx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl numops::lsls
                    add sp, #8
                    pop {pc}
_numops_lsrs:
    @scope _numops_lsrs
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    ; r3 := (r1 >> 1) & 0x1f
    lsls r3, r1, #26
    lsrs r3, r3, #27
    asrs r2, r0, #1
    lsrs r2, r3
    lsrs r3, r2, #30
    bne .boxed
    lsls r0, r2, #1
    adds r0, r0, #1
    blx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl numops::lsrs
                    add sp, #8
                    pop {pc}
_numops_asrs:
    @scope _numops_asrs
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    ; r3 := (r1 >> 1) & 0x1f
    lsls r3, r1, #26
    lsrs r3, r3, #27
    asrs r0, r3
    movs r2, #1
    orrs r0, r2
    blx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl numops::asrs
                    add sp, #8
                    pop {pc}
@scope _numops_toInt
_numops_toInt:
    asrs r0, r0, #1
    bcc .over
    blx lr
.over:
    lsls r0, r0, #1
    push {lr}
mov r7, sp
    str r7, [r6, #4]
bl pxt::toInt
pop {pc}
_numops_fromInt:
    lsls r2, r0, #1
    asrs r1, r2, #1
    cmp r0, r1
    bne .over2
    adds r0, r2, #1
    blx lr
.over2:
    push {lr}
mov r7, sp
    str r7, [r6, #4]
bl pxt::fromInt
pop {pc}
.section code
.object _pxt_helper_cmp_lt
_cmp_lt:
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r0, r1
    blt .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                        bl numops::lt
                        bl numops::toBoolDecr
                        cmp r0, #0
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_cmp_gt
_cmp_gt:
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r0, r1
    bgt .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                        bl numops::gt
                        bl numops::toBoolDecr
                        cmp r0, #0
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_cmp_le
_cmp_le:
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r0, r1
    ble .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                        bl numops::le
                        bl numops::toBoolDecr
                        cmp r0, #0
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_cmp_ge
_cmp_ge:
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r0, r1
    bge .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                        bl numops::ge
                        bl numops::toBoolDecr
                        cmp r0, #0
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_cmp_eq
_cmp_eq:
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r0, r1
    beq .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                        bl numops::eq
                        bl numops::toBoolDecr
                        cmp r0, #0
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_cmp_eqq
_cmp_eqq:
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r0, r1
    beq .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                        bl numops::eqq
                        bl numops::toBoolDecr
                        cmp r0, #0
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_cmp_neq
_cmp_neq:
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r0, r1
    bne .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                        bl numops::neq
                        bl numops::toBoolDecr
                        cmp r0, #0
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_cmp_neqq
_cmp_neqq:
    lsls r2, r0, #31
    beq .boxed
    lsls r2, r1, #31
    beq .boxed
    subs r0, r1
    bne .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                        bl numops::neqq
                        bl numops::toBoolDecr
                        cmp r0, #0
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_switch_eq
_pxt_switch_eq:
    @scope _pxt_switch_eq
    lsls r2, r0, #31    ; arg0 a tagged int? (low bit set)
    beq .boxed
    lsls r2, r1, #31    ; arg1 a tagged int?
    beq .boxed
    cmp r0, r1          ; tagged ints compare equal iff identical
    beq .true
.false:
    movs r0, #0
    bx lr
.true:
    movs r0, #1
    bx lr
.boxed:
    push {lr, r0, r1}      
                    mov r7, sp
    str r7, [r6, #4]
                    bl pxt::switch_eq
                    add sp, #8
                    pop {pc}
.section code
.object _pxt_helper_array_length_tagged
_pxt_array_length_tagged:
    @scope _pxt_array_length_tagged
    lsls r1, r0, #30    ; pointer? (low 2 bits 00)
    bne .boxed
    cmp r0, #0          ; non-null?
    beq .boxed
    ldr r2, [r0, #0]    ; load vtable
    ldrh r2, [r2, #8]   ; vtable class id
    cmp r2, #6
    bne .boxed
    ldrh r0, [r0, #8]   ; length field
    lsls r0, r0, #1     ; tag as int: (n<<1)|1
    adds r0, r0, #1
    bx lr
.boxed:
    push {lr}
    mov r7, sp
    str r7, [r6, #4]
bl Array_::length
    bl _numops_fromInt
    pop {pc}
_helpers_end:
.balign 4
.object _pxt_iface_member_names
_pxt_iface_member_names:
    .word 1
    .word _str281  ; 0 .
    .word 0
_vtables_end:
.balign 4
.object _pxt_config_data
_pxt_config_data:
    .word 0
.balign 4
_img2:
 .short 0xffff
        .short 5, 5
        .byte 0,255,0,255,0,255,255,255,255,255,255,255,255,255,255,0,255,255,255,0,0,0,255,0,0,0
.balign 4
_img3:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,255,0,255,0,0,255,255,255,0,0,0,255,0,0,0,0,0,0,0,0
.balign 4
_img4:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,255,0,255,0,0,0,0,0,0,255,0,0,0,255,0,255,255,255,0,0
.balign 4
_img5:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,255,0,255,0,0,0,0,0,0,0,255,255,255,0,255,0,0,0,255,0
.balign 4
_img6:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,255,0,255,0,0,0,0,0,0,0,255,0,255,0,255,0,255,0,255,0
.balign 4
_img7:
 .short 0xffff
        .short 5, 5
        .byte 255,0,0,0,255,0,255,0,255,0,0,0,0,0,0,255,255,255,255,255,255,0,255,0,255,0
.balign 4
_img8:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,255,255,0,255,255,0,0,0,0,0,0,255,255,255,0,0,0,0,0,0,0
.balign 4
_img9:
 .short 0xffff
        .short 5, 5
        .byte 0,255,0,255,0,0,0,0,0,0,0,0,255,0,0,0,255,0,255,0,0,0,255,0,0,0
.balign 4
_img10:
 .short 0xffff
        .short 5, 5
        .byte 255,0,0,0,255,0,0,0,0,0,255,255,255,255,255,0,0,0,255,255,0,0,0,255,255,0
.balign 4
_img11:
 .short 0xffff
        .short 5, 5
        .byte 255,255,255,255,255,255,255,0,255,255,0,0,0,0,0,0,255,0,255,0,0,255,255,255,0,0
.balign 4
_img12:
 .short 0xffff
        .short 5, 5
        .byte 255,255,0,255,255,0,0,0,0,0,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,0
.balign 4
_img13:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,0,0,0,255,0,0,0,255,0,255,0,255,0,0,0,255,0,0,0,0
.balign 4
_img14:
 .short 0xffff
        .short 5, 5
        .byte 255,0,0,0,255,0,255,0,255,0,0,0,255,0,0,0,255,0,255,0,255,0,0,0,255,0
.balign 4
_img15:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,0,255,0,0,0,255,0,255,0,255,255,255,255,255,0,0,0,0,0,0
.balign 4
_img16:
 .short 0xffff
        .short 5, 5
        .byte 255,0,0,0,0,255,255,0,0,0,255,0,255,0,0,255,0,0,255,0,255,255,255,255,255,0
.balign 4
_img17:
 .short 0xffff
        .short 5, 5
        .byte 0,255,0,255,0,255,0,255,0,255,0,255,0,255,0,255,0,255,0,255,0,255,0,255,0,0
.balign 4
_img18:
 .short 0xffff
        .short 5, 5
        .byte 0,0,255,0,0,0,255,0,255,0,255,0,0,0,255,0,255,0,255,0,0,0,255,0,0,0
.balign 4
_img19:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,0,255,0,0,0,255,0,255,0,0,0,255,0,0,0,0,0,0,0,0
.balign 4
_img20:
 .short 0xffff
        .short 5, 5
        .byte 255,255,255,255,255,255,0,0,0,255,255,0,0,0,255,255,0,0,0,255,255,255,255,255,255,0
.balign 4
_img21:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,255,255,255,0,0,255,0,255,0,0,255,255,255,0,0,0,0,0,0,0
.balign 4
_img22:
 .short 0xffff
        .short 5, 5
        .byte 255,255,0,0,255,255,255,0,255,0,0,0,255,0,0,255,255,0,255,0,255,255,0,0,255,0
.balign 4
_img23:
 .short 0xffff
        .short 5, 5
        .byte 255,255,0,255,255,255,255,255,255,255,0,255,255,255,0,0,255,255,255,0,0,255,255,255,0,0
.balign 4
_img24:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,255,255,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,0,255,0,255,0,0
.balign 4
_img25:
 .short 0xffff
        .short 5, 5
        .byte 0,255,255,0,0,255,255,255,0,0,0,255,255,255,255,0,255,255,255,0,0,0,0,0,0,0
.balign 4
_img26:
 .short 0xffff
        .short 5, 5
        .byte 0,0,255,0,0,0,255,255,255,0,255,255,255,255,255,0,255,255,255,0,0,255,0,255,0,0
.balign 4
_img27:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,255,255,255,0,255,255,255,255,255,0,255,0,255,0,0,0,0,0,0,0
.balign 4
_img28:
 .short 0xffff
        .short 5, 5
        .byte 255,255,0,255,255,255,255,255,255,255,0,0,255,0,0,255,255,255,255,255,255,255,0,255,255,0
.balign 4
_img29:
 .short 0xffff
        .short 5, 5
        .byte 0,0,255,0,0,255,255,255,255,255,0,0,255,0,0,0,255,0,255,0,255,0,0,0,255,0
.balign 4
_img30:
 .short 0xffff
        .short 5, 5
        .byte 0,255,255,255,0,255,0,255,0,255,255,255,255,255,255,255,255,255,255,255,255,0,255,0,255,0
.balign 4
_img31:
 .short 0xffff
        .short 5, 5
        .byte 0,0,255,0,0,0,0,255,0,0,0,0,255,0,0,0,255,255,255,0,0,0,255,0,0,0
.balign 4
_img32:
 .short 0xffff
        .short 5, 5
        .byte 255,255,0,0,0,0,255,0,0,0,0,255,0,0,0,0,255,255,255,0,0,255,0,255,0,0
.balign 4
_img33:
 .short 0xffff
        .short 5, 5
        .byte 0,255,255,255,0,255,0,255,0,255,255,255,255,255,255,0,255,255,255,0,0,255,255,255,0,0
.balign 4
_img34:
 .short 0xffff
        .short 5, 5
        .byte 0,255,255,255,0,255,255,255,255,255,0,0,255,0,0,255,0,255,0,0,255,255,255,0,0,0
.balign 4
_img35:
 .short 0xffff
        .short 5, 5
        .byte 255,255,0,0,0,255,255,0,255,255,0,255,0,255,0,0,255,255,255,0,0,0,0,0,0,0
.balign 4
_img36:
 .short 0xffff
        .short 5, 5
        .byte 255,0,255,0,0,255,0,255,0,0,255,255,255,255,0,255,255,0,255,0,255,255,255,255,0,0
.balign 4
_img37:
 .short 0xffff
        .short 5, 5
        .byte 255,0,0,0,255,255,0,0,0,255,255,255,255,255,255,0,255,255,255,0,0,0,255,0,0,0
.balign 4
_img38:
 .short 0xffff
        .short 5, 5
        .byte 0,0,255,0,0,0,0,255,0,0,0,0,255,0,0,255,255,255,0,0,255,255,255,0,0,0
.balign 4
_img39:
 .short 0xffff
        .short 5, 5
        .byte 0,0,255,0,0,0,0,255,255,0,0,0,255,0,255,255,255,255,0,0,255,255,255,0,0,0
.balign 4
_img40:
 .short 0xffff
        .short 5, 5
        .byte 0,0,255,0,0,0,0,255,255,0,0,0,255,0,255,255,255,255,0,0,255,255,255,0,0,0
.balign 4
_img41:
 .short 0xffff
        .short 5, 5
        .byte 255,0,255,0,255,255,0,255,0,255,255,255,255,255,255,0,0,255,0,0,0,0,255,0,0,0
.balign 4
_img42:
 .short 0xffff
        .short 5, 5
        .byte 0,0,255,0,0,0,255,255,255,0,255,255,0,255,255,0,255,255,255,0,0,0,255,0,0,0
.balign 4
_img43:
 .short 0xffff
        .short 5, 5
        .byte 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
            .balign 4
            .object _str281
_str281:
 .word pxt::string_inline_ascii_vt
    .short 0
    .string ""
            .balign 4
            .object _str0
_str0:
 .word pxt::string_inline_ascii_vt
    .short 1
    .string ","
            .balign 4
            .object _str1
_str1:
 .word pxt::string_inline_ascii_vt
    .short 1
    .string "?"
            .balign 4
            .object _str44
_str44:
 .word pxt::string_inline_ascii_vt
    .short 1
    .string "\n"
            .balign 4
            .object _str45
_str45:
 .word pxt::string_inline_ascii_vt
    .short 2
    .string ": "
            .balign 4
            .object _str46
_str46:
 .word pxt::string_inline_ascii_vt
    .short 6
    .string "string"
            .balign 4
            .object _str47
_str47:
 .word pxt::string_inline_ascii_vt
    .short 6
    .string "number"
            .balign 4
            .object _str48
_str48:
 .word pxt::string_inline_ascii_vt
    .short 3
    .string "..."
            .balign 4
            .object _str49
_str49:
 .word pxt::string_inline_ascii_vt
    .short 15
    .string "[object Object]"
            .balign 4
            .object _str50
_str50:
 .word pxt::string_inline_ascii_vt
    .short 8
    .string "[Object]"
            .balign 4
            .object _str51
_str51:
 .word pxt::string_inline_ascii_vt
    .short 1
    .string "{"
            .balign 4
            .object _str52
_str52:
 .word pxt::string_inline_ascii_vt
    .short 5
    .string "\n    "
            .balign 4
            .object _str53
_str53:
 .word pxt::string_inline_ascii_vt
    .short 8
    .string "\n    ..."
            .balign 4
            .object _str54
_str54:
 .word pxt::string_inline_ascii_vt
    .short 2
    .string "\n}"
            .balign 4
            .object _str57
_str57:
 .word pxt::string_inline_ascii_vt
    .short 1
    .string ":"
            .balign 4
            .object _str58
_str58:
 .word pxt::string_inline_ascii_vt
    .short 16
    .string "act square start"
            .balign 4
            .object _str59
_str59:
 .word pxt::string_inline_ascii_vt
    .short 24
    .string "act square done heading="
            .balign 4
            .object _str60
_str60:
 .word pxt::string_inline_ascii_vt
    .short 8
    .string "act stop"
            .balign 4
            .object _str61
_str61:
 .word pxt::string_inline_ascii_vt
    .short 15
    .string "act track start"
            .balign 4
            .object _str62
_str62:
 .word pxt::string_inline_ascii_vt
    .short 14
    .string "act track done"
            .balign 4
            .object _str63
_str63:
 .word pxt::string_inline_ascii_vt
    .short 5
    .string "btn A"
            .balign 4
            .object _str64
_str64:
 .word pxt::string_inline_ascii_vt
    .short 5
    .string "btn B"
            .balign 4
            .object _str65
_str65:
 .word pxt::string_inline_ascii_vt
    .short 6
    .string "btn AB"
            .balign 4
            .object _str66
_str66:
 .word pxt::string_inline_ascii_vt
    .short 6
    .string "square"
            .balign 4
            .object _str67
_str67:
 .word pxt::string_inline_ascii_vt
    .short 5
    .string "track"
            .balign 4
            .object _str68
_str68:
 .word pxt::string_inline_ascii_vt
    .short 4
    .string "stop"
            .balign 4
            .object _str69
_str69:
 .word pxt::string_inline_ascii_vt
    .short 1
    .string "a"
            .balign 4
            .object _str70
_str70:
 .word pxt::string_inline_ascii_vt
    .short 7
    .string "raise A"
            .balign 4
            .object _str71
_str71:
 .word pxt::string_inline_ascii_vt
    .short 1
    .string "b"
            .balign 4
            .object _str72
_str72:
 .word pxt::string_inline_ascii_vt
    .short 7
    .string "raise B"
            .balign 4
            .object _str73
_str73:
 .word pxt::string_inline_ascii_vt
    .short 2
    .string "ab"
            .balign 4
            .object _str74
_str74:
 .word pxt::string_inline_ascii_vt
    .short 8
    .string "raise AB"
            .balign 4
            .object _str75
_str75:
 .word pxt::string_inline_ascii_vt
    .short 4
    .string "ping"
            .balign 4
            .object _str76
_str76:
 .word pxt::string_inline_ascii_vt
    .short 13
    .string "pong heading="
            .balign 4
            .object _str77
_str77:
 .word pxt::string_inline_ascii_vt
    .short 12
    .string "run rx name="
            .balign 4
            .object _str78
_str78:
 .word pxt::string_inline_ascii_vt
    .short 5
    .string " arg="
            .balign 4
            .object _str79
_str79:
 .word pxt::string_inline_ascii_vt
    .short 18
    .string "boot main.ts ready"
            .balign 4
            .object _str80
_str80:
 .word pxt::string_inline_ascii_vt
    .short 20
    .string "nezha-robot-template"
.object _dbl55
.balign 4
_dbl55:
 .word pxt::number_vt
        .hex 000000000000f03c
.object _dbl56
.balign 4
_dbl56:
 .word pxt::number_vt
        .hex 000000000000b03f
.balign 4
.section code
.object _perf_counters
_pxt_perf_counters:
    .word 0
_literals_end:
