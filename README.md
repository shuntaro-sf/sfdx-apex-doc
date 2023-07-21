# @shuntaro/sfdx-apex-doc

[![NPM](https://img.shields.io/npm/v/@shuntaro/sfdx-apex-doc.svg?label=@shuntaro/sfdx-apex-doc)](https://www.npmjs.com/package/@shuntaro/sfdx-apex-doc) [![Downloads/week](https://img.shields.io/npm/dw/@shuntaro/sfdx-apex-doc.svg)](https://npmjs.org/package/@shuntaro/sfdx-apex-doc) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/@shuntaro/sfdx-apex-doc/main/LICENSE.txt)

<!--
## Using the template

This repository provides a template for creating a plugin for the Salesforce CLI. To convert this template to a working plugin:

1. Please get in touch with the Platform CLI team. We want to help you develop your plugin.
2. Generate your plugin:

   ```
   sf plugins install dev
   sf dev generate plugin

   git init -b main
   git add . && git commit -m "chore: initial commit"
   ```

3. Create your plugin's repo in the salesforcecli github org
4. When you're ready, replace the contents of this README with the information you want.

## Learn about `sf` plugins

Salesforce CLI plugins are based on the [oclif plugin framework](<(https://oclif.io/docs/introduction.html)>). Read the [plugin developer guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_plugins.meta/sfdx_cli_plugins/cli_plugins_architecture_sf_cli.htm) to learn about Salesforce CLI plugin development.

This repository contains a lot of additional scripts and tools to help with general Salesforce node development and enforce coding standards. You should familiarize yourself with some of the [node developer packages](#tooling) used by Salesforce.

Additionally, there are some additional tests that the Salesforce CLI will enforce if this plugin is ever bundled with the CLI. These test are included by default under the `posttest` script and it is required to keep these tests active in your plugin if you plan to have it bundled.

### Tooling

- [@salesforce/core](https://github.com/forcedotcom/sfdx-core)
- [@salesforce/kit](https://github.com/forcedotcom/kit)
- [@salesforce/sf-plugins-core](https://github.com/salesforcecli/sf-plugins-core)
- [@salesforce/ts-types](https://github.com/forcedotcom/ts-types)
- [@salesforce/ts-sinon](https://github.com/forcedotcom/ts-sinon)
- [@salesforce/dev-config](https://github.com/forcedotcom/dev-config)
- [@salesforce/dev-scripts](https://github.com/forcedotcom/dev-scripts)

### Hooks

For cross clouds commands, e.g. `sf env list`, we utilize [oclif hooks](https://oclif.io/docs/hooks) to get the relevant information from installed plugins.

This plugin includes sample hooks in the [src/hooks directory](src/hooks). You'll just need to add the appropriate logic. You can also delete any of the hooks if they aren't required for your plugin.

# Everything past here is only a suggestion as to what should be in your specific plugin's description

This plugin is bundled with the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). For more information on the CLI, read the [getting started guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm).

We always recommend using the latest version of these commands bundled with the CLI, however, you can install a specific version or tag if needed.

-->

## Install

```bash
sf plugins install @shuntaro/sfdx-apex-doc@x.y.z
```

## Issues

Please report any issues at https://github.com/forcedotcom/cli/issues

## Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
8. Sign CLA (see [CLA](#cla) below).
9. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

### CLA

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

### Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:salesforcecli/@shuntaro/sfdx-apex-doc

# Install the dependencies and compile
yarn && yarn build
```

To use your plugin, run using the local `./bin/dev` or `./bin/dev.cmd` file.

```bash
# Run using local run file.
./bin/dev hello generate
```

There should be no differences when running via the Salesforce CLI or using the local run file. However, it can be useful to link the plugin to do some additional testing or run your commands from anywhere on your machine.

```bash
# Link your plugin to the sf cli
sf plugins link .
# To verify
sf plugins
```

## Commands

<!-- commands -->

- [`sf apexdoc doc generate`](#sf-apexdoc-doc-generate)
- [`sf apexdoc flowdiagram generate`](#sf-apexdoc-flowdiagram-generate)

## `sf apexdoc doc generate`

Generates Apex doc to READ.md.

```
USAGE
  $ sf apexdoc doc generate -i <value> -o <value> [--json] [-d <value>] [-u <value>] [-v <value>]

FLAGS
  -d, --docsdir=<value>     [default: docs] directory that Apex documentation markdown files are saved in.
  -i, --inputdir=<value>    (required) input directory that apex classes are stored in.
  -o, --outputdir=<value>   (required) output directory that includes README.md.
  -u, --repourl=<value>     repository url that includes README.md and outputdir to save Apex documentations.
  -v, --releasever=<value>  release version of repository.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generates Apex doc to READ.md.

  Generates Apex doc in the Apex Developer document format to READ.md.

EXAMPLES
  Generates Apex doc to README.md:

    $ sfdx apexdoc:generate -i <inputdirecroy> -o <outputdirecroy>
```

## `sf apexdoc flowdiagram generate`

Generates Apex doc to READ.md.

```
USAGE
  $ sf apexdoc flowdiagram generate -i <value> -o <value> [--json]

FLAGS
  -i, --inputdir=<value>   (required) input directory that apex classes are stored in.
  -o, --outputdir=<value>  (required) output directory that includes README.md.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Generates Apex doc to READ.md.

  Generates Apex doc in the Apex Developer document format to READ.md.

EXAMPLES
  Generates Apex flow diagram built with mermaid statement-v:

    $ sfdx apexdoc:flowdiagram:generate -i <inputdirecroy> -o <outputdirecroy>
```

<!-- commandsstop -->

# Example

## sf apexdoc doc generate

The example of formatting the following apex class: DynamicDao.cls.

```apex
public inherited sharing class DynamicDao {
  private System.Type sObjectType;

  private static final String SELECT_STRING = 'SELECT ';
  private static final String FROM_STRING = ' FROM ';
  private static final String WHERE_STRING = ' WHERE ';
  private static final String WITH_STRING = ' WITH ';
  private static final String GROUP_STRING = ' GROUP BY ';
  private static final String ORDER_STRING = ' ORDER BY ';
  private static final String LIMIT_STRING = ' LIMIT ';
  private static final String OFFSET_STRING = ' OFFSET ';
  private static final String FOR_VIEW_STRING = ' FOR VIEW ';
  private static final String FOR_REFERENCE_STRING = ' FOR REFERENCE ';
  private static final String UPDATE_STRING = ' UPDATE ';
  private static final String FOR_UPDATE_STRING = ' FOR UPDATE ';
  private static final String COUNT_STRING = ' COUNT() ';

  /**
   * @description Constructor providing object type.
   * @param sObjectType SObject type.
   */
  public DynamicDao(System.Type sObjectType) {
    if (Schema.getGlobalDescribe().get(sObjectType.toString()) == null) {
      throw new ExceptionMessage.CustomException(ExceptionMessage.MESSAGES.get('dynamicDaoNotFoundSObject'));
    }
    this.sObjectType = sObjectType;
  }

  /**
   * @description Gets the records of sObjectType.
   * @param soqlQueryClause SoqlQueryClause object to be converted to a soql query string when extracting records.
   * @return List of sObjectType class.
   * @example
   */
  public List<SObject> getSelfSObjectRecords(SoqlQueryClause soqlQueryClause) {
    List<SObject> recordList = new List<SObject>();

    validatesSoqlClaseForSelfDml(soqlQueryClause);

    String queryStr = getSoqlQuery(soqlQueryClause, false);
    recordList = Database.query(queryStr);
    return recordList;
  }
}
```

The `apexdoc:generate` formats the above class to the following markdown and insert the markdown script into `<usage>` tag on the existing README.md:

### DynamicDao

Constructor providing object type.

```apex
SIGNATURE



public DynamicDao(System.Type sObjectType)

PARAMETERS

  sObjectType

    Description: sObjectType SObject type.

    Type: System.Type

RETURN VALUE


```

### getSelfSObjectRecords

Gets the records of sObjectType.

```apex
SIGNATURE



public List<SObject> getSelfSObjectRecords(SoqlQueryClause soqlQueryClause)

PARAMETERS

  soqlQueryClause

    Description: soqlQueryClause SoqlQueryClause object to be converted to a soql query string when extracting records.

    Type: SoqlQueryClause

RETURN VALUE

  List<SObject>
```

# sf apexdoc flowdiagram generate`

This command is in development not tested out at all! Thefore, we cannot ensure everything works fine.

the command creates flow-diagram built with mermaid-stateDiagram-v2. An example of producing the following Apex classe's flow diagram:

```apex
public inherited sharing class NoneMethods {
  public void method() {
    System.debug('dd');
    if (true) {
      System.debug('if');
    } else if (true) {
      System.debug('elseif');
    } else {
      System.debug('else');
    }
    System.debug('ddd');
    for (Integer idx = 0; idx < 10; idx++) {
      System.debug('for');
    }
    Integer i = 0;
    switch on i {
      when 1 {
        System.debug('1');
        if (i < 2) {
          System.debug('i is less than 2');
        } else {
          System.debug('i not is less than 2');
        }
      }
      when 2 {
        System.debug('2');
      }
    }
    while (i < 10) {
      System.debug(i);
      i++;
    }
    do {
      for (Integer e : new List<Integer> lst) {
        System.debug('do');
      }
    } while (i < 10)
  }
}
```

The output diagram:

```mermaid
stateDiagram-v2
state "
    System.debug('dd');" as ex0
state if0 <<choice>>
state "
      System.debug('if');" as ex1
state if1 <<choice>>
state "
      System.debug('elseif');" as ex2
state "
      System.debug('else');" as ex3
state "
    System.debug('ddd');" as ex4
state "For loop
Integer idx = 0" as for0
state if3 <<choice>>
state "
      System.debug('for');" as ex5
state " idx++" as ex6
state "
    Integer i = 0;" as ex7
state "switch on i " as switch0
state whenswitch0 <<choice>>
state "
        System.debug('1');" as ex8
state if5 <<choice>>
state "
          System.debug('i is less than 2');" as ex9
state "
          System.debug('i not is less than 2');" as ex10
state "
        System.debug('2');" as ex11
state "while loop" as while0
state if7 <<choice>>
state "
      System.debug(i);" as ex12
state "
      i++;" as ex13
state "Do while loop" as doWhile0
state "For loop
Integer e : new List<Integer> lst" as for1
state if11 <<choice>>
state "
        System.debug('do');" as ex14
state "next e" as ex15
state if9 <<choice>>
[*] --> ex0
ex0 --> if0
if0 --> ex1 : true
if0 --> if1 : else
ex1 --> ex4
if1 --> ex2 : true
if1 --> ex3 : else
ex2 --> ex4
ex3 --> ex4
ex4 --> for0
for0 --> if3
if3 --> ex5 :  idx < 10
if3 --> ex7 : else
ex5 --> ex6
ex6 --> if3
ex7 --> switch0
switch0 --> whenswitch0
whenswitch0 --> ex8 : 1
ex8 --> if5
if5 --> ex9 : i < 2
if5 --> ex10 : else
ex9 --> while0
ex10 --> while0
whenswitch0 --> ex11 : 2
ex11 --> while0
while0 --> if7
if7 --> ex12 : i < 10
if7 --> doWhile0 : else
ex12 --> ex13
ex13 --> if7
doWhile0 --> for1
for1 --> if11
if11 --> ex14 : collection
if11 --> if9 : else
ex14 --> ex15
ex15 --> if11
if9 --> for1 : i < 10
if9 --> [*] : else
```

The example of if statements:

```apex
public void nests() {
  if (true) {
    if (true) {
      if (true) {
        if (true) {
          if (true) {
            if (true) {
              if (true) {
                System.debug('nest');
              }
            }
          }
        }
      }
    }
  }
}
```

```mermaid
stateDiagram-v2
state if13 <<choice>>
state if14 <<choice>>
state if15 <<choice>>
state if16 <<choice>>
state if17 <<choice>>
state if18 <<choice>>
state if19 <<choice>>
state "System.debug('nest');" as ex16
[*] --> if13
if13 --> if14 : true
if14 --> if15 : true
if15 --> if16 : true
if16 --> if17 : true
if17 --> if18 : true
if18 --> if19 : true
if19 --> ex16 : true
ex16 --> [*]
if19 --> [*] : else
if18 --> [*] : else
if17 --> [*] : else
if16 --> [*] : else
if15 --> [*] : else
if14 --> [*] : else
if13 --> [*] : else
```

The example of for statements:

```apex
public void fors() {
  for (Integer i = 0; i < 100; i++) {
    for (Integer j = 0; j < 100; j++) {
      for (Integer k = 0; k < 100; k++) {
        for (Integer l = 0; l < 100; l++) {
          for (Integer m = 0; m < 100; m++) {
            System.debug('for');
          }
        }
      }
    }
  }
}
```

```mermaid
stateDiagram-v2
state "For loop
Integer i = 0" as for2
state if20 <<choice>>
state "For loop
Integer j = 0" as for3
state if22 <<choice>>
state "For loop
Integer k = 0" as for4
state if24 <<choice>>
state "For loop
Integer l = 0" as for5
state if26 <<choice>>
state "For loop
Integer m = 0" as for6
state if28 <<choice>>
state "System.debug('for');" as ex25
state " m++" as ex26
state " l++" as ex27
state " k++" as ex28
state " j++" as ex29
state " i++" as ex30
[*] --> for2
for2 --> if20
if20 --> for3 :  i < 100
for3 --> if22
if22 --> for4 :  j < 100
for4 --> if24
if24 --> for5 :  k < 100
for5 --> if26
if26 --> for6 :  l < 100
for6 --> if28
if28 --> ex25 :  m < 100
ex25 --> ex26
ex26 --> if28
if28 --> ex27 : else
ex27 --> if26
if26 --> ex28 : else
ex28 --> if24
if24 --> ex29 : else
ex29 --> if22
if22 --> ex30 : else
ex30 --> if20
if20 --> [*] : else
```

The example of switch statements:

```apex
public void switches(){
  Integer i = 0;
  switch on i {
    when 0 {
      System.debug(i);
    }
    when 1 {
      System.debug(i);
    }
    when 2 {
      System.debug(i);
    }
    when 3 {
      System.debug(i);
    }
    when 4 {
      System.debug(i);
    }
    when 5 {
      System.debug(i);
    }
    when else {
      System.debug(i);
    }
  }
}
```

```mermaid
stateDiagram-v2
state "Integer i = 0;" as ex17
state "switch on i " as switch1
state whenswitch1 <<choice>>
state "System.debug(i);" as ex18
state "System.debug(i);" as ex19
state "System.debug(i);" as ex20
state "System.debug(i);" as ex21
state "System.debug(i);" as ex22
state "System.debug(i);" as ex23
state "System.debug(i);" as ex24
[*] --> ex17
ex17 --> switch1
switch1 --> whenswitch1
whenswitch1 --> ex18 : 0
ex18 --> [*]
whenswitch1 --> ex19 : 1
ex19 --> [*]
whenswitch1 --> ex20 : 2
ex20 --> [*]
whenswitch1 --> ex21 : 3
ex21 --> [*]
whenswitch1 --> ex22 : 4
ex22 --> [*]
whenswitch1 --> ex23 : 5
ex23 --> [*]
whenswitch1 --> ex24 : else
ex24 --> [*]
```

Super nests:

```apex
public void superNests(){
  String str = 'ddd';
  if (str == 'ddd') {
    for (Integer i = 0; i < 10; i++) {
      if (str == 'ddd') {
        System.debug('first');
      } else if (str == 'dd') {
        System.debug('second');
      }
    }
  } else if (str == 'dd') {
    while (true) {
      if (str == 'ddd') {
        for (Integer int : new List<Integer> lst) {
          System.debug('third');
        }
      }
    }
  } else if (str == 'ssdd') {
    do {
      if (str == 'dddss') {
        for (Integer idx = 0; idx < 100; idx++) {
          System.debug('fourth');
        }
      }
    } while (true);
  } else if (str == 'sdsdd') {
    for (Integer idx = 0; idx < 100; idx++) {
      if (str == 'ddddss') {
        System.debug('fourth');
      }
    }
  } else {
    switch on str {
      when 'ddd' {
        for (Integer idx = 0; idx < 100; idx++) {
          System.debug('fourth');
          if (str == 'ddd') {
            System.debug('fourth');
          } else {
            System.debug('fifth');
          }
        }
      }
      when 'dd' {
        if (str == 'ddd') {
          System.debug('sixth');
        } else {
          System.debug('seventh');
        }
      }
      when else {
        if (str == 'ddd') {
          System.debug('eitgth');
        } else {
          System.debug('nineth');
        }
      }
    }
  }
}
```

```mermaid
stateDiagram-v2
state "String str = 'ddd';" as ex31
state if30 <<choice>>
state "For loop
Integer i = 0" as for7
state if31 <<choice>>
state if33 <<choice>>
state "System.debug('first');" as ex32
state if34 <<choice>>
state "System.debug('second');" as ex33
state " i++" as ex34
state if35 <<choice>>
state "while loop" as while1
state if36 <<choice>>
state if38 <<choice>>
state "For loop
Integer int : new List<Integer> lst" as for8
state if39 <<choice>>
state "System.debug('third');" as ex35
state "next int" as ex36
state if41 <<choice>>
state "Do while loop" as doWhile1
state if44 <<choice>>
state "For loop
Integer idx = 0" as for9
state if45 <<choice>>
state "System.debug('fourth');" as ex37
state " idx++" as ex38
state if42 <<choice>>
state if47 <<choice>>
state "For loop
Integer idx = 0" as for10
state if48 <<choice>>
state if50 <<choice>>
state "System.debug('fourth');" as ex39
state " idx++" as ex40
state "switch on str " as switch2
state whenswitch2 <<choice>>
state "For loop
Integer idx = 0" as for11
state if52 <<choice>>
state "System.debug('fourth');" as ex41
state if54 <<choice>>
state "System.debug('fourth');" as ex42
state "System.debug('fifth');" as ex43
state " idx++" as ex44
state if56 <<choice>>
state "System.debug('sixth');" as ex45
state "System.debug('seventh');" as ex46
state if58 <<choice>>
state "System.debug('eitgth');" as ex47
state "System.debug('nineth');" as ex48
[*] --> ex31
ex31 --> if30
if30 --> for7 : str == 'ddd'
for7 --> if31
if31 --> if33 :  i < 10
if33 --> ex32 : str == 'ddd'
ex32 --> ex34
if33 --> if34 : else
if34 --> ex33 : str == 'dd'
ex33 --> ex34
if34 --> ex34 : else
ex34 --> if31
if31 --> [*] : else
if30 --> if35 : else
if35 --> while1 : str == 'dd'
while1 --> if36
if36 --> if38 : true
if38 --> for8 : str == 'ddd'
for8 --> if39
if39 --> ex35 : collection
ex35 --> ex36
ex36 --> if39
if39 --> if36 : else
if38 --> if36 : else
if36 --> [*] : else
if35 --> if41 : else
if41 --> doWhile1 : str == 'ssdd'
doWhile1 --> if44
if44 --> for9 : str == 'dddss'
for9 --> if45
if45 --> ex37 :  idx < 100
ex37 --> ex38
ex38 --> if45
if45 --> if42 : else
if44 --> if42 : else
if42 --> if44 : true
if42 --> [*] : else
if41 --> if47 : else
if47 --> for10 : str == 'sdsdd'
for10 --> if48
if48 --> if50 :  idx < 100
if50 --> ex39 : str == 'ddddss'
ex39 --> ex40
if50 --> ex40 : else
ex40 --> if48
if48 --> [*] : else
if47 --> switch2 : else
switch2 --> whenswitch2
whenswitch2 --> for11 : 'ddd'
for11 --> if52
if52 --> ex41 :  idx < 100
ex41 --> if54
if54 --> ex42 : str == 'ddd'
ex42 --> ex44
if54 --> ex43 : else
ex43 --> ex44
ex44 --> if52
if52 --> [*] : else
whenswitch2 --> if56 : 'dd'
if56 --> ex45 : str == 'ddd'
ex45 --> [*]
if56 --> ex46 : else
ex46 --> [*]
whenswitch2 --> if58 : else
if58 --> ex47 : str == 'ddd'
ex47 --> [*]
if58 --> ex48 : else
ex48 --> [*]
```
