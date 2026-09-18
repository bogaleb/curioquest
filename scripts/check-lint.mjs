import {ESLint} from 'eslint';
const results=await new ESLint().lintFiles(['app','lib','components','hooks','tests','scripts','db']);
for(const result of results)for(const message of result.messages)console.log(`${result.filePath}:${message.line} ${message.severity===2?'error':'warning'} ${message.ruleId}: ${message.message.split('\n')[0]}`);
const errors=results.reduce((n,r)=>n+r.errorCount,0);console.log(`${errors} lint errors.`);process.exitCode=errors?1:0;
